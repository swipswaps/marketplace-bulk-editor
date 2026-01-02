/**
 * Collapsible Markdown Component
 * Parses markdown headings and creates collapsible sections with table of contents
 */

import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, List, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface CollapsibleMarkdownProps {
  content: string;
  showTableOfContents?: boolean;
}

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

export function CollapsibleMarkdown({ content, showTableOfContents = true }: CollapsibleMarkdownProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showTOC, setShowTOC] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse markdown into sections based on headings
  const sections = useMemo(() => {
    const lines = content.split('\n');
    const parsedSections: Section[] = [];
    let currentSection: Section | null = null;
    let sectionContent: string[] = [];

    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          currentSection.endLine = index - 1;
          parsedSections.push(currentSection);
        }

        // Start new section
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        currentSection = {
          id,
          title,
          level,
          content: '',
          startLine: index,
          endLine: index,
        };
        sectionContent = [line];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    });

    // Save last section
    if (currentSection) {
      (currentSection as Section).content = sectionContent.join('\n');
      (currentSection as Section).endLine = lines.length - 1;
      parsedSections.push(currentSection);
    }

    return parsedSections;
  }, [content]);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  // Auto-expand sections that match search
  useEffect(() => {
    if (searchQuery.trim() && filteredSections.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedSections(new Set(filteredSections.map(s => s.id)));
    }
  }, [searchQuery, filteredSections]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Expand the section
      setExpandedSections(prev => new Set(prev).add(id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documentation..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Collapse All
          </button>
        </div>
        
        {showTableOfContents && (
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <List size={14} />
            {showTOC ? 'Hide' : 'Show'} Table of Contents
          </button>
        )}
      </div>

      {/* Table of Contents */}
      {showTOC && showTableOfContents && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Table of Contents</h3>
          <ul className="space-y-1">
            {sections.map(section => (
              <li
                key={section.id}
                style={{ paddingLeft: `${(section.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline text-left"
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {filteredSections.length === 0 && searchQuery && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No sections found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredSections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          const isTopLevel = section.level === 1 || section.level === 2;

          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`border rounded-lg ${
                isTopLevel
                  ? 'border-gray-300 dark:border-gray-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                  isTopLevel
                    ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`font-semibold ${
                  section.level === 1 ? 'text-lg' :
                  section.level === 2 ? 'text-base' :
                  'text-sm'
                } text-gray-900 dark:text-white`}>
                  {section.title}
                </span>
                {isExpanded ? (
                  <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                  prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-2
                  prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                  prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-3
                  prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:font-semibold
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-8
                  prose-table:border-collapse prose-table:w-full
                  prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left
                  prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-2
                  prose-img:rounded-lg prose-img:shadow-md
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                      code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => (
                        <CodeBlock inline={inline} className={className} {...props}>
                          {children}
                        </CodeBlock>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

