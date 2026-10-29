import React from "react";

/**
 * FormattedMessage parses assistant responses into rich, highly readable UI elements.
 * Features:
 * - Clean headers and distinct section dividers
 * - Formula cards for mathematical equations (Croston-SBA, Safety Stock, ROQ)
 * - Safe bold and italic parsing with zero leaking asterisks (**)
 * - Colored badges for batch status, roles, and medicine attributes
 * - Crisp, high-contrast typography (text-slate-800, leading-relaxed)
 */
export default function FormattedMessage({ text }) {
  if (!text) return null;

  // Split lines
  const lines = text.split("\n");
  const elements = [];
  let currentKey = 0;
  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div
            key={currentKey++}
            className="my-2.5 p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner"
          >
            <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty lines -> vertical spacer
    if (!trimmed) {
      elements.push(<div key={currentKey++} className="h-2" />);
      continue;
    }

    // Formula Detection (lines starting with '$$' or containing mathematical formulas like ROQ =, SS =, Forecast =)
    const isFormulaLine =
      trimmed.startsWith("$$") ||
      trimmed.endsWith("$$") ||
      (trimmed.includes(" = ") && (trimmed.includes("SS =") || trimmed.includes("ROQ =") || trimmed.includes("Forecast") || trimmed.includes("Forecast Demand") || trimmed.includes("Safety Stock (SS)")));

    if (isFormulaLine) {
      const cleanFormula = trimmed
        .replace(/^\$\$|\$\$$/g, "")
        .replace(/\\left|\\right/g, "")
        .replace(/\\times/g, "×")
        .replace(/\\sigma/g, "σ")
        .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
        .replace(/\\text\{([^}]+)\}/g, "$1")
        .replace(/\\hat\{y\}_\{t\+1\}/g, "Forecast(t+1)")
        .replace(/z_t/g, "z(t)")
        .replace(/p_t/g, "p(t)")
        .replace(/\\max/g, "max")
        .replace(/\\alpha/g, "α")
        .replace(/\\beta/g, "β")
        .replace(/\\ge/g, "≥")
        .replace(/\\le/g, "≤");

      elements.push(
        <div
          key={currentKey++}
          className="my-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/80 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <span>📐 Mathematical Formula</span>
          </div>
          <div className="font-mono text-xs sm:text-[13px] font-semibold text-emerald-300 tracking-wide overflow-x-auto py-0.5">
            {cleanFormula}
          </div>
        </div>
      );
      continue;
    }

    // Major Headers (# or ##)
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const title = cleanText(trimmed.replace(/^#+\s*/, ""));
      elements.push(
        <h3
          key={currentKey++}
          className="font-bold text-slate-900 text-sm sm:text-[15px] mt-3.5 mb-1.5 pb-1 border-b border-slate-200/80 flex items-center gap-1.5"
        >
          {renderFormattedInline(title)}
        </h3>
      );
      continue;
    }

    // Sub Headers (###)
    if (trimmed.startsWith("### ")) {
      const title = cleanText(trimmed.replace(/^###\s*/, ""));
      elements.push(
        <h4 key={currentKey++} className="font-bold text-slate-900 text-xs sm:text-sm mt-2.5 mb-1">
          {renderFormattedInline(title)}
        </h4>
      );
      continue;
    }

    // Blockquote (> )
    if (trimmed.startsWith("> ")) {
      const quote = cleanText(trimmed.replace(/^>\s*/, ""));
      elements.push(
        <div
          key={currentKey++}
          className="pl-3 py-1.5 my-1.5 border-l-3 border-brand-500 bg-brand-50/70 rounded-r-lg text-xs sm:text-[13px] text-slate-700 font-medium italic"
        >
          {renderFormattedInline(quote)}
        </div>
      );
      continue;
    }

    // Numbered List (1. ...)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={currentKey++} className="flex items-start gap-2 ml-1 my-1 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
          <span className="w-5 h-5 rounded-md bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1 min-w-0">
            {renderFormattedInline(cleanText(numMatch[2]))}
          </div>
        </div>
      );
      continue;
    }

    // Bullet Points (•, -, *)
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = cleanText(trimmed.replace(/^[•\-*]\s+/, ""));
      elements.push(
        <div key={currentKey++} className="flex items-start gap-2 ml-1 my-1 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0 mt-2" />
          <div className="flex-1 min-w-0">
            {renderFormattedInline(content)}
          </div>
        </div>
      );
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={currentKey++} className="text-xs sm:text-[13px] text-slate-800 leading-relaxed my-1">
        {renderFormattedInline(cleanText(trimmed))}
      </p>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Clean unclosed markers and raw LaTeX tags from text
 */
function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/\$DaysRemaining < TreatmentDays\$/g, "(Days Remaining < Treatment Days)")
    .replace(/\$DaysRemaining \\ge TreatmentDays\$/g, "(Days Remaining ≥ Treatment Days)")
    .replace(/\$DaysRemaining \\le 0\$/g, "(Days Remaining ≤ 0)")
    .replace(/\$SS\$/g, "Safety Stock (SS)")
    .replace(/\$D_\{30\}\$/g, "30-Day Demand")
    .replace(/\$I_\\text\{curr\}\$/g, "Current Stock")
    .replace(/\$L\$/g, "Lead Time (L)")
    .replace(/\$Z\$/g, "Z-Score")
    .replace(/\$z_t\$/g, "z(t)")
    .replace(/\$p_t\$/g, "p(t)")
    .replace(/\\times/g, "×")
    .replace(/\\ge/g, "≥")
    .replace(/\\le/g, "≤");
}

/**
 * Render inline formatting (Bold, Italic, Badges, Code) cleanly without leaving stray asterisks
 */
function renderFormattedInline(text) {
  if (!text) return null;

  // Tokenize by code blocks first `...`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    // If inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      const isDanger = inner.includes("EXPIRED") || inner.includes("CRITICAL") || inner.includes("DEPLETED");
      const isSuccess = inner.includes("USABLE") || inner.includes("FEFO") || inner.includes("COMPLETED");

      return (
        <code
          key={pIdx}
          className={`px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold border ${
            isDanger
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : isSuccess
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-brand-700 border-slate-200"
          }`}
        >
          {inner}
        </code>
      );
    }

    // Parse Bold: **...**
    const boldParts = part.split(/(\*\*[^*]+?\*\*)/g);

    return (
      <React.Fragment key={pIdx}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length >= 4) {
            const inner = bPart.slice(2, -2);
            return (
              <strong key={bIdx} className="font-semibold text-slate-900">
                {parseItalics(inner)}
              </strong>
            );
          }
          // Remove any stray unclosed ** if present
          const cleanPart = bPart.replace(/\*\*/g, "");
          return <React.Fragment key={bIdx}>{parseItalics(cleanPart)}</React.Fragment>;
        })}
      </React.Fragment>
    );
  });
}

/**
 * Parse Italics: *...*
 */
function parseItalics(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+?\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-slate-600">
          {inner}
        </em>
      );
    }
    // Remove any remaining loose asterisks
    return part.replace(/^\*|\*$/g, "");
  });
}
