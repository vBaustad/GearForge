import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Plus, Minus, X, Package } from "lucide-react";

export interface SelectedItem {
  decorId: number;
  name: string;
  iconUrl?: string;
  quantity: number;
}

interface ItemPickerProps {
  selectedItems: SelectedItem[];
  onItemsChange: (items: SelectedItem[]) => void;
}

export function ItemPicker({ selectedItems, onItemsChange }: ItemPickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search decor items from our cached database
  const searchResults = useQuery(
    api.gameData.getDecorItems,
    search.length >= 2 ? { search, limit: 10 } : "skip"
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addItem = (item: { blizzardId: number; name: string; iconUrl?: string }) => {
    const existing = selectedItems.find((i) => i.decorId === item.blizzardId);
    if (existing) {
      // Increment quantity if already added
      onItemsChange(
        selectedItems.map((i) =>
          i.decorId === item.blizzardId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      // Add new item
      onItemsChange([
        ...selectedItems,
        {
          decorId: item.blizzardId,
          name: item.name,
          iconUrl: item.iconUrl,
          quantity: 1,
        },
      ]);
    }
    setSearch("");
    setIsOpen(false);
  };

  const updateQuantity = (decorId: number, delta: number) => {
    onItemsChange(
      selectedItems
        .map((item) =>
          item.decorId === decorId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (decorId: number) => {
    onItemsChange(selectedItems.filter((item) => item.decorId !== decorId));
  };

  const setQuantity = (decorId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(decorId);
    } else {
      onItemsChange(
        selectedItems.map((item) =>
          item.decorId === decorId ? { ...item, quantity } : item
        )
      );
    }
  };

  return (
    <div className="item-picker" ref={wrapperRef}>
      {/* Search Input */}
      <div className="item-picker-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="input"
          placeholder="Search decor items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && search.length >= 2 && (
        <div className="item-picker-dropdown">
          {searchResults === undefined ? (
            <div className="item-picker-loading">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="item-picker-empty">No items found</div>
          ) : (
            searchResults.map((item) => (
              <button
                key={item.blizzardId}
                type="button"
                className="item-picker-result"
                onClick={() => addItem(item)}
              >
                <div className="item-picker-result-icon">
                  {item.iconUrl ? (
                    <img src={item.iconUrl} alt="" loading="lazy" />
                  ) : (
                    <Package size={24} />
                  )}
                </div>
                <div className="item-picker-result-info">
                  <span className="item-picker-result-name">{item.name}</span>
                  {item.category && (
                    <span className="item-picker-result-category">{item.category}</span>
                  )}
                </div>
                <Plus size={18} className="item-picker-result-add" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="item-picker-selected">
          <div className="item-picker-selected-header">
            <span>Items Used</span>
            <span className="text-muted">{selectedItems.length} items</span>
          </div>
          <div className="item-picker-selected-list">
            {selectedItems.map((item) => (
              <div key={item.decorId} className="item-picker-item">
                <div className="item-picker-item-icon">
                  {item.iconUrl ? (
                    <img src={item.iconUrl} alt="" loading="lazy" />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                <div className="item-picker-item-info">
                  <span className="item-picker-item-name">{item.name}</span>
                </div>
                <div className="item-picker-item-quantity">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.decorId, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.decorId, parseInt(e.target.value) || 0)}
                    className="quantity-input"
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.decorId, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="item-picker-item-remove"
                  onClick={() => removeItem(item.decorId)}
                  aria-label="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
