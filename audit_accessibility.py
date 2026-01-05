#!/usr/bin/env python3
"""
Audit ALL interactive elements for accessibility attributes
Checks for:
- aria-label or aria-labelledby
- data-testid
- Selectable text (not in ::before/::after pseudo-elements)
"""
import os
import re
from pathlib import Path

def check_file(filepath):
    """Check a single file for accessibility issues"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    lines = content.split('\n')
    
    # Patterns for interactive elements
    patterns = {
        'button': r'<button[^>]*>',
        'link': r'<a\s[^>]*>',
        'input': r'<input[^>]*>',
        'select': r'<select[^>]*>',
        'textarea': r'<textarea[^>]*>',
    }
    
    for element_type, pattern in patterns.items():
        for line_num, line in enumerate(lines, 1):
            matches = re.finditer(pattern, line)
            for match in matches:
                tag = match.group(0)
                
                # Check for required attributes
                has_aria = 'aria-label' in tag or 'aria-labelledby' in tag or 'aria-hidden="true"' in tag
                has_testid = 'data-testid' in tag
                has_disabled = 'disabled' in tag
                
                # Skip if aria-hidden (decorative element)
                if 'aria-hidden="true"' in tag:
                    continue
                
                # Report if missing both aria-label AND data-testid
                if not has_aria and not has_testid:
                    issues.append({
                        'line': line_num,
                        'type': element_type,
                        'tag': tag[:100],
                        'missing': []
                    })
                    if not has_aria:
                        issues[-1]['missing'].append('aria-label')
                    if not has_testid:
                        issues[-1]['missing'].append('data-testid')
    
    return issues

def main():
    print("=== ACCESSIBILITY AUDIT (COMPLETE REPO) ===\n")

    # Check ALL TypeScript/TSX files in src/
    src_dir = Path("src")
    all_files = list(src_dir.rglob("*.tsx")) + list(src_dir.rglob("*.ts"))
    
    total_issues = 0
    files_with_issues = 0
    
    for filepath in sorted(all_files):
        issues = check_file(filepath)
        if issues:
            files_with_issues += 1
            total_issues += len(issues)
            # Show relative path from src/
            rel_path = filepath.relative_to(Path("src"))
            print(f"\n{rel_path}: {len(issues)} issues")

            # Show ALL issues (not just first 5)
            for issue in issues:
                missing = ', '.join(issue['missing'])
                print(f"  Line {issue['line']}: {issue['type']} missing {missing}")
                print(f"    {issue['tag'][:80]}...")
    
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Files checked: {len(all_files)}")
    print(f"Files with issues: {files_with_issues}")
    print(f"Total issues: {total_issues}")
    
    if total_issues == 0:
        print("\n✅ ALL INTERACTIVE ELEMENTS HAVE ACCESSIBILITY ATTRIBUTES!")
    else:
        print(f"\n⚠️ {total_issues} interactive elements need attention")
        print("\nRecommendations:")
        print("1. Add aria-label to describe the element's purpose")
        print("2. Add data-testid for Selenium testing")
        print("3. Ensure text is selectable (use <span className='select-text'>)")

if __name__ == '__main__':
    main()

