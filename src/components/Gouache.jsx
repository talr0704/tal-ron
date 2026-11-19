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

export function Doves() {
  return (
    <div className="gouache-doves" aria-hidden="true">
      {["left", "right"].map((side) => (
        <div key={side} className={`dove dove-${side}`}>
          <Art name="dove-far-wing" className="dove-far-wing" />
          <Art name="dove-body" className="dove-body" />
          <Art name="dove-wing" className="dove-wing" />
        </div>
      ))}
      <Art name="ribbon-left" className="ribbon-left" />
      <Art name="ribbon-right" className="ribbon-right" />
      <Art name="ribbon-heart" className="ribbon-heart" />
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
          <Art
            name="couple"
            className="couple-base"
            alt="טל ורון שוכבים שלובי זרועות על הדשא"
          />
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
