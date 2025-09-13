import React from "react";

type Props = {
  value: string;
  onChange(v: string): void;
  open: boolean;
  onToggle(): void;
};

const LocationInput: React.FC<Props> = ({ value, onChange, open, onToggle }) => {
  return (
    <div className="upload-post__location">
      {open && (
        <input
          type="text"
          placeholder="Location"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default LocationInput;
