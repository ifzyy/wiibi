/**
 * components/SafeHtml.jsx
 *
 * The ONLY approved way to render server-provided HTML (blog/project/product
 * rich text). Raw dangerouslySetInnerHTML is a stored-XSS sink: if any of that
 * content is ever influenced by an attacker — or an admin account is
 * compromised — unsanitised markup runs script in the victim's session
 * (cookie-auth'd, so it can act as them).
 *
 * DOMPurify strips scripts, event handlers, javascript: URLs, etc. while
 * keeping normal formatting. Use this instead of dangerouslySetInnerHTML
 * everywhere.
 */

import DOMPurify from 'dompurify';

// Force all links to open safely and never leak the opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const SafeHtml = ({ html, className, as: Tag = 'div', ...rest }) => {
  const clean = DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } });
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
      {...rest}
    />
  );
};

export default SafeHtml;
