import { useState, useEffect, useRef, LegacyRef } from "react";
import uPlot from "uplot";
//import type { UplotData } from "./ProgressPane.astro";
import { styled } from "styled-components";
import "uplot/dist/uPlot.min.css";
import { Progress, Version, fetchProgress } from "../lib/progress";

type UplotData = [number[], number[]];

interface ChartProps {
  stroke: string;
  fill: string;
  color: string;
  version: Version;
}

interface DataViewProps {
  uplotData: UplotData;
  data: Progress[];
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

const DataView = ({ uplotData, data, stroke, fill, color }: DataViewProps) => {
  const latest = data[data.length - 1];

  const [selectedEntry, setSelectedEntry] = useState(latest);
  const uplotEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (uplotEl.current && uplotData.length) {
      let { width, height } = uplotEl.current.getBoundingClientRect();
      height = 400; // look into this!
      console.log(width, height);
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
                    setSelectedEntry(data[idx]);
                  }
                },
              },
            },
          ],
        },
        uplotData,
        uplotEl.current
      );
      function onResize() {
        console.log("should set");
        if (uplotEl.current) {
          const { width, height } = uplotEl.current.getBoundingClientRect();
          console.log("set", width, height);
          uplot.setSize({ width, height });
        }
      }
      document.addEventListener("resize", onResize);

      return () => {
        uplot.destroy();
        document.removeEventListener("resize", onResize);
      };
    }
  }, [uplotData, uplotEl.current, stroke]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flex: 1,
        }}
      >
        <PercentHeader>
          {latest && formatPercent(latest.percentBytes)} decompiled
        </PercentHeader>
        <OuterShadowDiv>
          <InnerShadowDiv>
            <ProgressChart ref={uplotEl} />
            {latest && (
              <ProgressPercent title="Latest matched percentage">
                {formatPercent(latest.percentBytes)}
              </ProgressPercent>
            )}
          </InnerShadowDiv>

          <SelectedEntry aria-hidden={true}>
            {selectedEntry
              ? formatTimestamp(selectedEntry.timestamp, {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : ""}
          </SelectedEntry>
        </OuterShadowDiv>

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
      </div>
    </>
  );
};

const PercentHeader = styled.h1`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const OuterShadowDiv = styled.div`
  background: #ffffff44;
  backdrop-filter: blur(4px);

  padding: 1em;
  margin: 0.5em;
  margin-bottom: 1em;

  border-radius: 16px;
  box-shadow: 0.4em 0.4em rgba(0, 0, 0, 0.15);

  border-top: 4px solid #ffffffaa;
  padding-top: calc(1em - 2px);

  border-left: 4px solid #ffffffaa;
  border-right: 4px solid #00000055;
  border-bottom: 4px solid #00000055;

  position: relative;

  flex: 1;
`;

const InnerShadowDiv = styled.div`
  border-radius: 12px;
  box-shadow: inset 0.4em 0.4em rgba(0, 0, 0, 0.15);

  border-top: 4px solid #00000055;
  border-left: 4px solid #00000055;
  border-bottom: 4px solid #ffffffaa;
  border-right: 4px solid #ffffffaa;

  width: 100%;
  height: 100%;

  display: flex;
  position: relative;
  overflow: hidden;

  background: white;

  padding: 0.7em;
  background: #e2e1d8;
`;

const ProgressChart = styled.div`
  flex: 1;

  font-size: 14px;
  overflow: hidden;

  user-select: none;
  -webkit-user-select: none;
`;

const ProgressPercent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  font-size: max(48px, 10vw);
  color: rgba(0, 0, 0, 0.15);

  pointer-events: none;
`;

const SelectedEntry = styled.button`
  position: absolute;
  left: 50%;
  bottom: -1em;
  transform: translateX(-50%);

  width: 90%;
  max-width: 600px;

  text-align: center;

  border-radius: 1em;

  padding-top: 0.2em;
  height: 1.2em;

  cursor: default;
`;

export const Chart = ({ stroke, fill, color, version }: ChartProps) => {
  const [data, setData] = useState<Progress[]>();
  const [upData, setUpData] = useState<UplotData>();

  useEffect(() => {
    const fetchWrapper = async () => {
      const data = await fetchProgress(version);
      setData(data);

      const uplotData = data.reduce(
        (acc, current) => {
          acc[0].push(current.timestamp);
          acc[1].push(current.percentBytes);
          return acc;
        },
        [[], []] as UplotData
      );

      setUpData(uplotData);
    };

    fetchWrapper();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {data && upData && (
        <DataView
          uplotData={upData}
          data={data}
          stroke={stroke}
          fill={fill}
          color={color}
        />
      )}
    </div>
  );
};
