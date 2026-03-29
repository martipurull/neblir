import React from "react";

interface KeyValueItem {
  label: string;
  value: React.ReactNode;
}

interface KeyValueListProps {
  items: KeyValueItem[];
}

const KeyValueList: React.FC<KeyValueListProps> = ({ items }) => {
  return (
    <div className="space-y-1 text-sm text-black">
      {items.map((item) => (
        <p key={item.label}>
          <span className="font-semibold">{item.label}:</span> {item.value}
        </p>
      ))}
    </div>
  );
};

export default KeyValueList;
