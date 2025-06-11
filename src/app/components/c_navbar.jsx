import React from "react";
export default function Navbar() {
  const navItems = [
    { name: "about", href: "/about" },
    { name: "tutorial", href: "/tutorial" },
    { name: "levels", href: "/levels" },
  ];

  return (
    <nav className=" absolute top-0 z-50 ">
      <div className="flex justify-center items-center h-16 w-screen">
        {/* Desktop Navigation */}
        <div className="w-[90vw] md:w-[60vw]">
          <div className=" flex justify-center items-baseline gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-text hover:text-blue text-sm font-medium transition-colors duration-200 relative group"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
