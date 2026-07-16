import { Fragment, type ReactNode } from "react";
import { headingId } from "../archive-content.server";

function renderInline(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  const output: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text))) {
    if (match.index > cursor) output.push(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**")) {
      output.push(<strong key={key}>{renderInline(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("`")) {
      output.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const external = /^https?:\/\//.test(link[2]);
        output.push(
          <a
            key={key}
            href={link[2]}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {link[1]}
          </a>,
        );
      }
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) output.push(text.slice(cursor));
  return output;
}

function isTableDivider(line: string) {
  return /^\|?\s*:?-{3,}/.test(line.trim());
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function startsBlock(line: string, nextLine?: string) {
  return (
    /^#{2,3}\s+/.test(line) ||
    /^>/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    (line.trim().startsWith("|") && Boolean(nextLine && isTableDivider(nextLine)))
  );
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (heading) {
      const level = heading[1].length;
      const cleanTitle = heading[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      const content = renderInline(heading[2]);
      blocks.push(
        level === 2 ? (
          <h2 id={headingId(cleanTitle)} key={`h-${index}`}>
            {content}
          </h2>
        ) : (
          <h3 id={headingId(cleanTitle)} key={`h-${index}`}>
            {content}
          </h3>
        ),
      );
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      const callout = /^\[!info\]\s*(.*)$/.exec(quoteLines[0] ?? "");
      const contentLines = callout ? quoteLines.slice(1) : quoteLines;
      const bullets = contentLines.filter((item) => /^-\s+/.test(item));
      const prose = contentLines.filter((item) => !/^-\s+/.test(item));
      blocks.push(
        <aside className={callout ? "archive-callout" : "archive-quote"} key={`q-${index}`}>
          {callout && <div className="callout-title">{callout[1] || "档案信息"}</div>}
          {prose.map((item, itemIndex) => (
            <p key={`qp-${itemIndex}`}>{renderInline(item)}</p>
          ))}
          {bullets.length > 0 && (
            <ul>
              {bullets.map((item, itemIndex) => (
                <li key={`qb-${itemIndex}`}>{renderInline(item.replace(/^-\s+/, ""))}</li>
              ))}
            </ul>
          )}
        </aside>,
      );
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      lines[index + 1] &&
      isTableDivider(lines[index + 1])
    ) {
      const headers = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="table-scroll" key={`t-${index}`}>
          <table>
            <thead>
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th key={`th-${cellIndex}`}>{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`tr-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`td-${cellIndex}`}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line.trim());
    if (unordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^[-*]\s+(.+)$/.exec(lines[index].trim());
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`uli-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const ordered = /^(\d+)\.\s+(.+)$/.exec(line.trim());
    if (ordered) {
      const start = Number(ordered[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^(\d+)\.\s+(.+)$/.exec(lines[index].trim());
        if (!item) break;
        let value = item[2];
        index += 1;
        while (index < lines.length && /^\s{2,}\S/.test(lines[index])) {
          value += ` ${lines[index].trim()}`;
          index += 1;
        }
        items.push(value);
        while (index < lines.length && !lines[index].trim()) index += 1;
      }
      blocks.push(
        <ol start={start} key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`oli-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !startsBlock(lines[index], lines[index + 1])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`}>
        {paragraph.map((part, partIndex) => (
          <Fragment key={`part-${partIndex}`}>
            {partIndex > 0 && " "}
            {renderInline(part)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className="markdown-body">{blocks}</div>;
}
