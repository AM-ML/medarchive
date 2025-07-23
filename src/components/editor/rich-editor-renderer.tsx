import { useEffect, useRef } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '../../lib/cn';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface RichEditorRendererProps {
  content: any;
  className?: string;
  maxWidth?: number | string;
  runCode?: boolean;
}

export function RichEditorRenderer({ 
  content, 
  className, 
  maxWidth = '900px',
  runCode = false 
}: RichEditorRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;
    
    try {
      // Convert Editor.js data to HTML with styling
      const html = convertToHTML(content);
      
      // Sanitize HTML to prevent XSS attacks
      // Allow iframes for embeds if needed
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      });
      
      // Set the innerHTML of the container
      containerRef.current.innerHTML = sanitizedHtml;
      
      // Apply syntax highlighting to code blocks
      if (containerRef.current.querySelectorAll('pre code').length > 0) {
        containerRef.current.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }
      
      // Enhanced code execution for JavaScript blocks
      if (runCode) {
        const javaScriptCodeBlocks = Array.from(containerRef.current.querySelectorAll('.executable-code'));
        
        if (javaScriptCodeBlocks.length > 0) {
          javaScriptCodeBlocks.forEach((codeBlock) => {
            try {
              const codeContent = codeBlock.textContent || '';
              
              // Create execute button
              const executeButton = document.createElement('button');
              executeButton.textContent = 'Run Code';
              executeButton.className = 'execute-code-btn';
              
              // Create output container
              const outputContainer = document.createElement('div');
              outputContainer.className = 'code-output-container';
              
              // Add the button to the DOM
              codeBlock.parentNode?.appendChild(executeButton);
              codeBlock.parentNode?.appendChild(outputContainer);
              
              // Set up button click handler
              executeButton.onclick = () => {
                try {
                  // Clear any previous output
                  outputContainer.innerHTML = '';
                  
                  // Create output display
                  const outputDiv = document.createElement('div');
                  outputDiv.className = 'code-output';
                  
                  // Store original console methods
                  const originalLog = console.log;
                  const originalInfo = console.info;
                  const originalWarn = console.warn;
                  const originalError = console.error;
                  
                  // Capture console output
                  const outputs: Array<{type: string, content: string}> = [];
                  
                  // Override console methods to capture output
                  console.log = (...args) => {
                    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    outputs.push({ type: 'log', content: output });
                    originalLog.apply(console, args);
                  };
                  
                  console.info = (...args) => {
                    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    outputs.push({ type: 'info', content: output });
                    originalInfo.apply(console, args);
                  };
                  
                  console.warn = (...args) => {
                    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    outputs.push({ type: 'warning', content: output });
                    originalWarn.apply(console, args);
                  };
                  
                  console.error = (...args) => {
                    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    outputs.push({ type: 'error', content: output });
                    originalError.apply(console, args);
                  };

                  // Execute the code and capture return value
                  let result;
                  try {
                    // Use a safer approach - iframe or Function constructor with limited scope
                    result = new Function('return (function() { ' + codeContent + ' })();')();
                  } catch (executionError) {
                    result = `Error: ${executionError instanceof Error ? executionError.message : String(executionError)}`;
                    outputs.push({ type: 'error', content: result });
                  }
                  
                  // Restore original console methods
                  console.log = originalLog;
                  console.info = originalInfo;
                  console.warn = originalWarn;
                  console.error = originalError;
                  
                  // Display console outputs
                  if (outputs.length > 0) {
                    const consoleOutput = document.createElement('div');
                    consoleOutput.className = 'console-output';
                    consoleOutput.innerHTML = '<strong>Console Output:</strong>';
                    
                    const outputList = document.createElement('ul');
                    outputList.className = 'console-output-list';
                    
                    outputs.forEach(item => {
                      const listItem = document.createElement('li');
                      listItem.className = `console-${item.type}`;
                      listItem.textContent = item.content;
                      outputList.appendChild(listItem);
                    });
                    
                    consoleOutput.appendChild(outputList);
                    outputDiv.appendChild(consoleOutput);
                  }
                  
                  // Display return value if any
                  if (result !== undefined && result !== null && result !== '') {
                    const resultOutput = document.createElement('div');
                    resultOutput.className = 'result-output';
                    resultOutput.innerHTML = '<strong>Return Value:</strong>';
                    
                    const resultContent = document.createElement('pre');
                    resultContent.textContent = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                    resultOutput.appendChild(resultContent);
                    
                    outputDiv.appendChild(resultOutput);
                  }
                  
                  // Add output to the DOM
                  outputContainer.appendChild(outputDiv);
                } catch (err) {
                  // Handle any errors in our code execution wrapper
                  outputContainer.innerHTML = `
                    <div class="code-error">
                      <strong>Error:</strong> ${err instanceof Error ? err.message : String(err)}
                    </div>
                  `;
                }
              };
              
              // Auto-execute if the code block contains HTML or embedding code
              if (codeContent.includes('<iframe') || codeContent.includes('<html') || codeContent.includes('document.write')) {
                executeButton.click();
              }
            } catch (err) {
              console.error('Error setting up code execution:', err);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error rendering content:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = '<p class="error">Error rendering content</p>';
      }
    }
  }, [content, runCode]);

  // Convert Editor.js data to HTML with enhanced styling
  const convertToHTML = (data: any): string => {
    if (!data || !data.blocks || !Array.isArray(data.blocks)) {
      return '<p>No content</p>';
    }

    let html = '';

    data.blocks.forEach((block: any) => {
      switch (block.type) {
        case 'paragraph':
          html += `<p class="article-paragraph">${block.data?.text || ''}</p>`;
          break;
          
        case 'header':
          const level = block.data?.level || 2;
          html += `<h${level} class="article-heading article-heading-${level}">${block.data?.text || ''}</h${level}>`;
          break;
          
        case 'list':
          const listType = block.data?.style === 'ordered' ? 'ol' : 'ul';
          html += `<${listType} class="article-list ${listType === 'ol' ? 'article-ordered-list' : 'article-unordered-list'}">`;
          if (block.data?.items && Array.isArray(block.data.items)) {
            block.data.items.forEach((item: any) => {
              const itemText = typeof item === 'string' 
                ? item 
                : (item?.content || item?.text || JSON.stringify(item));
              html += `<li>${itemText || ''}</li>`;
            });
          }
          html += `</${listType}>`;
          break;
          
        case 'quote':
          html += `<figure class="article-quote">
            <blockquote>${block.data?.text || ''}</blockquote>
            ${block.data?.caption ? `<figcaption>${block.data.caption}</figcaption>` : ''}
          </figure>`;
          break;
          
        case 'image':
          if (block.data?.file?.url) {
            const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
            html += `<figure class="article-image">
              <img src="${block.data.file.url}" alt="${block.data.caption || ''}" />
              ${caption}
            </figure>`;
          }
          break;
          
        case 'code':
          const codeLanguage = block.data?.language || '';
          const isExecutable = block.data?.language === 'javascript' || block.data?.language === 'js';
          html += `
            <div class="article-code">
              <pre><code class="${isExecutable ? 'executable-code' : ''} ${codeLanguage ? `language-${codeLanguage}` : ''}">${block.data?.code || ''}</code></pre>
            </div>
          `;
          break;
          
        case 'embed':
          const embedUrl = block.data?.embed || block.data?.service?.url || '';
          if (embedUrl) {
            html += `<div class="article-embed">
              <div class="article-embed-container" style="position: relative; width: 100%; max-width: 900px; overflow: hidden; padding-top: 56.25%;">
                <iframe 
                  src="${embedUrl}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                ></iframe>
              </div>
              ${block.data?.caption ? `<p class="article-embed-caption">${block.data.caption}</p>` : ''}
            </div>`;
          }
          break;
          
        case 'delimiter':
          html += '<hr class="article-delimiter" />';
          break;
          
        case 'table':
          html += '<div class="article-table-wrapper"><table class="article-table"><tbody>';
          if (Array.isArray(block.data?.content)) {
            block.data.content.forEach((row: string[]) => {
              html += '<tr>';
              if (Array.isArray(row)) {
                row.forEach((cell: string) => {
                  html += `<td>${cell}</td>`;
                });
              }
              html += '</tr>';
            });
          }
          html += '</tbody></table></div>';
          break;
          
        case 'checklist':
          html += '<div class="article-checklist">';
          if (Array.isArray(block.data?.items)) {
            block.data.items.forEach((item: { text: string; checked: boolean }) => {
              html += `<div class="article-checklist-item">
                <input type="checkbox" ${item.checked ? 'checked' : ''} disabled />
                <span>${item.text || ''}</span>
              </div>`;
            });
          }
          html += '</div>';
          break;
          
        default:
          console.log('Unknown block type:', block.type);
          break;
      }
    });

    return html;
  };

  const containerStyle = {
    maxWidth: maxWidth,
    margin: '0 auto',
    width: '100%'
  };

  return (
    <div 
      ref={containerRef} 
      className={cn('article-content', className)}
      style={containerStyle}
    >
      {/* Content will be injected here by the useEffect */}
    </div>
  );
}

// Replace the style component with a standard style element
const RichEditorStyle = () => {
  return (
    <style>
      {`
      .article-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: var(--foreground);
      }
      .article-heading {
        margin-top: 1.5em;
        margin-bottom: 0.75em;
        font-weight: 600;
        color: var(--foreground);
      }
      .article-heading-1 { font-size: 2rem; }
      .article-heading-2 { font-size: 1.75rem; }
      .article-heading-3 { font-size: 1.5rem; }
      .article-heading-4 { font-size: 1.25rem; }
      .article-paragraph {
        margin-bottom: 1em;
        color: var(--foreground);
      }
      .article-paragraph a {
        text-decoration: underline;
        
      }
      .article-list {
        margin-bottom: 1em;
        padding-left: 1.5em;
        color: var(--foreground);
      }
      .article-quote {
        margin: 1.5em 0;
        padding-left: 1em;
        border-left: 4px solid var(--border);
        color: var(--muted-foreground);
      }
      .article-quote blockquote {
        font-style: italic;
        margin: 0;
      }
      .article-quote figcaption {
        margin-top: 0.5em;
        font-size: 0.9em;
        opacity: 0.8;
        text-align: right;
      }
      .article-image {
        margin: 1.5em 0;
        text-align: center;
      }
      .article-image img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
      .article-image figcaption {
        margin-top: 0.5em;
        font-size: 0.9em;
        opacity: 0.8;
        color: var(--muted-foreground);
      }
      .article-code {
        margin: 1.5em 0;
      }
      .article-code pre {
        padding: 1em;
        border-radius: 4px;
        background-color: var(--muted);
        color: var(--foreground);
        overflow: auto;
      }
      .dark .article-code pre {
        background-color: hsl(var(--muted) / 0.3);
      }
      .article-embed {
        margin: 1.5em 0;
        max-width: 900px;
      }
      .article-embed-caption {
        margin-top: 0.5em;
        font-size: 0.9em;
        opacity: 0.8;
        text-align: center;
        color: var(--muted-foreground);
      }
      .article-delimiter {
        margin: 2em 0;
        border: none;
        border-top: 2px solid var(--border);
      }
      .article-table-wrapper {
        margin: 1.5em 0;
        overflow-x: auto;
      }
      .article-table {
        width: 100%;
        border-collapse: collapse;
      }
      .article-table td {
        border: 1px solid var(--border);
        padding: 0.5em;
        color: var(--foreground);
      }
      .article-checklist {
        margin: 1.5em 0;
        color: var(--foreground);
      }
      .article-checklist-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5em;
      }
      .article-checklist-item input {
        margin-right: 0.5em;
      }
      .execute-code-btn {
        padding: 0.3em 0.7em;
        background-color: #4f46e5;
        color: white;
        border: none;
        border-radius: 3px;
        font-size: 0.8em;
        cursor: pointer;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
        display: block;
      }
      .execute-code-btn:hover {
        background-color: #4338ca;
      }
      .code-output, .code-error {
        margin-top: 0.5em;
        padding: 0.5em;
        border-radius: 4px;
        color: var(--foreground);
      }
      .code-output {
        background-color: hsl(var(--success) / 0.2);
      }
      .dark .code-output {
        background-color: hsl(var(--success) / 0.2);
        border-color: hsl(var(--success) / 0.3);
      }
      .code-error {
        background-color: hsl(var(--destructive) / 0.2);
        border: 1px solid hsl(var(--destructive) / 0.2);
        color: hsl(var(--destructive));
      }
      .code-output-container {
        margin-top: 0.5em;
      }
      .console-output-list {
        list-style: none;
        padding: 0;
        margin: 0.5em 0;
      }
      .console-output strong, .result-output strong {
        display: block;
        margin-bottom: 0.3em;
        font-size: 0.9em;
        color: var(--muted-foreground);
      }
      .console-log {
        padding: 0.25em 0;
        color: var(--foreground);
      }
      .console-info {
        padding: 0.25em 0;
        color: hsl(var(--info));
      }
      .console-warning {
        padding: 0.25em 0;
        color: hsl(var(--warning));
      }
      .console-error {
        padding: 0.25em 0;
        color: hsl(var(--destructive));
      }
      .result-output pre {
        margin: 0.5em 0;
        padding: 0.5em;
        background-color: var(--muted);
        border-radius: 3px;
        overflow: auto;
        font-family: monospace;
        color: var(--foreground);
      }
      @media (max-width: 768px) {
        .article-content {
          padding: 0 1em;
        }
      }
      
      /* Additional improved styles for dark mode */
      .dark .article-content a {
        color: hsl(var(--primary));
      }
      .dark .article-content a:hover {
        text-decoration: underline;
      }
      .dark .article-code .hljs {
        background-color: hsl(var(--muted) / 0.3);
        color: hsl(var(--foreground));
      }
      `}
    </style>
  );
};

export { RichEditorStyle };
export default RichEditorRenderer; 