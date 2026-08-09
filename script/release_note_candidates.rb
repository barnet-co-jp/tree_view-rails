#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "net/http"
require "optparse"

module ReleaseNoteCandidates
  Entry = Struct.new(:type, :number, :title, :url, :closed_at, :merged_at)

  class GitHubClient
    def initialize(token: ENV["GITHUB_TOKEN"], api_base: "https://api.github.com")
      @token = token
      @api_base = api_base
    end

    def search(query)
      uri = URI("#{@api_base}/search/issues")
      uri.query = URI.encode_www_form(q: query, per_page: 100, sort: "updated", order: "desc")
      get_json(uri).fetch("items", [])
    end

    def compare(repo, base_ref)
      owner, name = repo.split("/", 2)
      encoded_ref = URI.encode_www_form_component(base_ref)
      get_json(URI("#{@api_base}/repos/#{owner}/#{name}/compare/#{encoded_ref}...HEAD"))
    end

    def issue(repo, number)
      owner, name = repo.split("/", 2)
      get_json(URI("#{@api_base}/repos/#{owner}/#{name}/issues/#{number}"))
    end

    private

    def get_json(uri)
      request = Net::HTTP::Get.new(uri)
      request["Accept"] = "application/vnd.github+json"
      request["Authorization"] = "Bearer #{@token}" if @token && !@token.empty?

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        abort "GitHub API request failed: #{response.code} #{response.message}\n#{uri}"
      end

      JSON.parse(response.body)
    end
  end

  class Collector
    MERGE_REF_PATTERN = /#(\d+)/

    def initialize(client: GitHubClient.new)
      @client = client
    end

    def by_since_date(repo:, since_date:)
      merged_prs = @client.search("repo:#{repo} is:pr is:merged merged:>=#{since_date}")
      closed_issues = @client.search("repo:#{repo} is:issue is:closed closed:>=#{since_date}")

      [entries_from_search(merged_prs, :pull_request), entries_from_search(closed_issues, :issue)]
    end

    def by_since_tag(repo:, since_tag:)
      compare = @client.compare(repo, since_tag)
      numbers = compare.fetch("commits", []).flat_map do |commit|
        commit.dig("commit", "message").to_s.scan(MERGE_REF_PATTERN).flatten
      end.uniq

      entries = numbers.map { |number| entry_from_issue(@client.issue(repo, number)) }
      entries.partition { |entry| entry.type == :pull_request }
    end

    private

    def entries_from_search(items, type)
      items.map do |item|
        Entry.new(
          type: type,
          number: item.fetch("number"),
          title: item.fetch("title"),
          url: item.fetch("html_url"),
          closed_at: item["closed_at"],
          merged_at: item.dig("pull_request", "merged_at")
        )
      end
    end

    def entry_from_issue(item)
      type = item.key?("pull_request") ? :pull_request : :issue
      Entry.new(
        type: type,
        number: item.fetch("number"),
        title: item.fetch("title"),
        url: item.fetch("html_url"),
        closed_at: item["closed_at"],
        merged_at: item.dig("pull_request", "merged_at")
      )
    end
  end

  class MarkdownFormatter
    def call(repo:, source:, merged_prs:, closed_issues:)
      lines = []
      lines << "# Release note candidates for #{repo}"
      lines << ""
      lines << "Source: #{source}"
      lines << ""
      lines << "This is a maintainer review aid. It does not rewrite CHANGELOG.md and does not decide the final release notes."
      lines << ""
      append_section(lines, "Merged pull requests", merged_prs)
      append_section(lines, "Closed issues", closed_issues)
      lines.join("\n") + "\n"
    end

    private

    def append_section(lines, title, entries)
      lines << "## #{title}"
      lines << ""

      if entries.empty?
        lines << "- No candidates found."
      else
        entries.sort_by(&:number).each do |entry|
          timestamp = entry.merged_at || entry.closed_at
          suffix = timestamp ? " (#{timestamp})" : ""
          lines << "- ##{entry.number} #{entry.title}#{suffix}"
          lines << "  #{entry.url}"
        end
      end

      lines << ""
    end
  end

  class CLI
    def self.run(argv)
      options = parse_options(argv)
      collector = Collector.new

      merged_prs, closed_issues = if options[:since]
        collector.by_since_date(repo: options.fetch(:repo), since_date: options.fetch(:since))
      else
        collector.by_since_tag(repo: options.fetch(:repo), since_tag: options.fetch(:since_tag))
      end

      source = options[:since] ? "closed or merged since #{options[:since]}" : "commit references since tag #{options[:since_tag]}"
      puts MarkdownFormatter.new.call(repo: options.fetch(:repo), source: source, merged_prs: merged_prs, closed_issues: closed_issues)
    end

    def self.parse_options(argv)
      options = {}
      OptionParser.new do |parser|
        parser.banner = "Usage: ruby script/release_note_candidates.rb --repo OWNER/REPO (--since YYYY-MM-DD | --since-tag vX.Y.Z)"
        parser.on("--repo REPO", "GitHub repository, for example barnet-co-jp/tree_view-rails") { |value| options[:repo] = value }
        parser.on("--since DATE", "Collect merged PRs and closed issues since YYYY-MM-DD") { |value| options[:since] = value }
        parser.on("--since-tag TAG", "Collect candidates referenced by commits since TAG") { |value| options[:since_tag] = value }
      end.parse!(argv)

      abort "--repo is required" unless options[:repo]
      abort "Use exactly one of --since or --since-tag" unless [options[:since], options[:since_tag]].compact.one?

      options
    end
  end
end

ReleaseNoteCandidates::CLI.run(ARGV) if $PROGRAM_NAME == __FILE__
