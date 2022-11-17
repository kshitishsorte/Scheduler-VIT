const labelClasses = [
  "indigo",
  "gray",
  "green",
  "blue",
  "red",
  "purple",
];
module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    
    safelist: [
      ...labelClasses.map((lbl) => `bg-${lbl}-500`),
      ...labelClasses.map((lbl) => `bg-${lbl}-200`),
      ...labelClasses.map((lbl) => `text-${lbl}-400`)
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans"]
      },
      gridTemplateColumns: {
        "1/5": "1fr 5fr"
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
