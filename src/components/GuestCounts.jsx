export default function GuestCounts({ adults, children, under5 }) {
  return (
    <div className="guest-counts">
      <span>
        מבוגרים:{" "}
        <strong>
          <bdi>{adults}</bdi>
        </strong>
      </span>
      <span>
        ילדים מגיל 5:{" "}
        <strong>
          <bdi>{children}</bdi>
        </strong>
      </span>
      <span>
        ילדים מתחת לגיל 5:{" "}
        <strong>
          <bdi>{under5}</bdi>
        </strong>
      </span>
    </div>
  );
}
