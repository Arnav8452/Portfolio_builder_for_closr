"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="mobile-nav-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div className="mobile-nav-menu">
          <a href="/creators" onClick={() => setIsOpen(false)}>Creator Portal</a>
          <a href="/p/demo" onClick={() => setIsOpen(false)}>Demo Profile</a>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--arcade-green)", fontSize: "10px", marginTop: "8px" }}>
            <span className="system-status" /> Systems operational
          </div>
        </div>
      )}
    </>
  );
}
