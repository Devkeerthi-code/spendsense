interface Props {
  headers: string[];
  sample: string[][];
  /** Column index -> role label picked for it. */
  tags: Map<number, string>;
}

export function SampleTable({ headers, sample, tags }: Props) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-max border-collapse text-left text-caption">
        <caption className="mb-2 text-left text-caption text-muted">First rows of your file</caption>
        <thead>
          <tr>
            {headers.map((h, i) => {
              const tag = tags.get(i);
              return (
                <th key={i} scope="col" className={`border-b border-line-strong px-2 pt-1 pb-2 align-bottom font-medium ${tag ? "bg-accent/15" : ""}`}>
                  {tag && <span className="mb-1 block font-mono text-caption tracking-[0.06em] text-accent-ink uppercase">{tag}</span>}
                  {h || `Column ${i + 1}`}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="num">
          {sample.map((row, r) => (
            <tr key={r} className="border-b border-dashed border-line">
              {headers.map((_, i) => (
                <td key={i} className={`max-w-56 truncate px-2 py-1.5 text-muted ${tags.has(i) ? "bg-accent/10 text-ink" : ""}`}>
                  {row[i] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
