import { preload } from "react-dom";

const directory = "/images/gouache";
const bloomFrames = [1, 2, 3, 4, 5];

export function preloadBloom() {
  for (const frame of bloomFrames) {
    preload(`${directory}/bloom-${frame}.webp`, { as: "image" });
  }
}

export function Art({ name, className, alt = "" }) {
  return (
    <img className={className} src={`${directory}/${name}.webp`} alt={alt} />
  );
}

export function Greeting({ name }) {
  return (
    <div className="gouache-greeting">
      <div className="greeting-doves" aria-hidden="true">
        {["left", "right"].map((side) => (
          <div key={side} className={`greeting-dove greeting-dove-${side}`}>
            <Art name="dove-far-wing" className="greeting-dove-wing far-wing" />
            <Art name="dove-body" className="greeting-dove-body" />
            <Art name="dove-wing" className="greeting-dove-wing near-wing" />
          </div>
        ))}
      </div>
      <p className="guest-name-frame">{name?.trim() || "נשמח לחגוג איתכם!"}</p>
    </div>
  );
}

export function Couple({ image }) {
  const custom =
    image && !["/couple.svg", "/images/couple.svg"].includes(image);
  return (
    <div className={`gouache-couple${custom ? " custom-couple" : ""}`}>
      {custom ? (
        <img className="couple-base" src={image} alt="איור זוגי של טל ורון" />
      ) : (
        <>
          <Art name="veil" className="couple-veil" />
          <div className="couple-portrait">
            <Art
              name="couple"
              className="couple-base"
              alt="טל ורון שוכבים שלובי זרועות על הדשא"
            />
            <Art
              name="couple-eyes-open"
              className="couple-eyes couple-eyes-open"
            />
            <Art
              name="couple-eyes-half"
              className="couple-eyes couple-eyes-half"
            />
          </div>
          <Art name="bouquet-ribbon" className="bouquet-ribbon" />
        </>
      )}
    </div>
  );
}

export function Bloom() {
  return (
    <div className="gouache-bloom" aria-hidden="true">
      {bloomFrames.map((frame) => (
        <Art
          key={frame}
          name={`bloom-${frame}`}
          className={`bloom-frame bloom-frame-${frame}`}
        />
      ))}
    </div>
  );
}
