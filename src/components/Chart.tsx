import { useState, useEffect, useRef } from "react";
import uPlot from "uplot";
//import type { UplotData } from "./ProgressPane.astro";

type UplotData = [number[], number[]];

interface ChartProps {
  uplotData: UplotData;
  stroke: string;
  fill: string;
  color: string;
}

interface DataViewProps {
  uplotData: UplotData;
  stroke: string;
  fill: string;
  color: string;
}

function formatTimestamp(timestamp: number, options = {}) {
  const date = new Date(timestamp * 1000);

  return new Intl.DateTimeFormat([], options).format(date);
}

function formatPercent(alpha: number) {
  return Math.round(alpha * 100) / 100 + "%";
}

// function EntryInfo({ entry, isLatest }) {
//   return (
//     <div>
//       <a href={`https://github.com/pmret/papermario/commit/${entry.commit}`}>
//         {entry.commit.substr(0, 8)}
//       </a>
//       {isLatest && " (latest commit)"}

//       <br />

//       <span className="thin">
//         Matched {formatPercent(entry.percentBytes)} bytes ({entry.matchingFuncs}
//         /{entry.totalFuncs} functions)
//       </span>
//     </div>
//   );
// }

const DataView = ({ uplotData, stroke, fill, color }: DataViewProps) => {
  const latest = uplotData[uplotData.length - 1];

  const [selectedEntry, setSelectedEntry] = useState(latest);
  const uplotEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (uplotEl.current && uplotData.length) {
      const { width, height } = uplotEl.current.getBoundingClientRect();
      const uplot = new uPlot(
        {
          width,
          height,
          series: [
            {},
            {
              scale: "%",
              value: (u, v) => (v == null ? "null" : v.toFixed(1) + "%"),
              stroke,
              fill,
              width: 3 / devicePixelRatio,
            },
          ],
          axes: [
            {},
            {
              scale: "%",
              values: (u, vals, space) => vals.map((v) => +v.toFixed(1) + "%"),
            },
          ],
          scales: {
            "%": {
              range: [0, 100],
            },
          },
          legend: {
            show: false,
          },
          plugins: [
            {
              hooks: {
                setCursor: (u) => {
                  const idx = u.cursor.idx;
                  if (typeof idx === "number") {
                    setSelectedEntry(uplotData[idx]);
                  }
                },
              },
            },
          ],
        },
        uplotData,
        uplotEl.current
      );
    }
  });

  return (
    <>
      <h1 className="aria-only">
        {latest && formatPercent(latest[8])} decompiled
      </h1>
      <div className="shadow-box flex-grow">
        <div
          className="shadow-box-inner"
          style={{
            padding: ".7em",
            background: "#e2e1d8",
          }}
        >
          <div className="progress-chart" ref={uplotEl} />
          {latest && (
            <div className="progress-percent" title="Latest matched percentage">
              {formatPercent(latest[8])}
            </div>
          )}
        </div>

        <button aria-hidden={true} className={"shadow-box-title " + color}>
          {selectedEntry
            ? formatTimestamp(selectedEntry[4], {
                dateStyle: "long",
                timeStyle: "short",
              })
            : ""}
        </button>
      </div>

      {/* {(uplotData.length &&
      selectedEntry &&
      captionPortal.current &&
      createPortal(
        <EntryInfo
          entry={selectedEntry}
          isLatest={selectedEntry.commit === latest.commit}
        />,
        captionPortal.current
      )) ||
      null} */}
    </>
  );
};

export const Chart = ({ uplotData, stroke, fill, color }: ChartProps) => {
  const [data, setData] = useState(uplotData);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {data && (
        <DataView uplotData={data} stroke={stroke} fill={fill} color={color} />
      )}
    </div>
  );
};
