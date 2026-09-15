import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function LiveTour() {
  useEffect(() => {
    // Don't automatically show the tour again
    // after the user has completed it.
    const completed = localStorage.getItem(
      "jcs_live_tour_completed"
    );

    if (completed === "true") {
      return;
    }

    // Give Navbar and Home time to render.
    const timer = setTimeout(() => {
      const allSteps = [
        {
          popover: {
            title: "👋 Welcome to JCS Global",
            description:
              "Welcome to JCS Global. Let us show you around the marketplace.",
          },
        },

        {
          element: "[data-tour='categories']",
          popover: {
            title: "📂 Categories",
            description:
              "Browse products by category such as Smartphones, Laptops, TVs and Accessories.",
          },
        },

        {
          element: "[data-tour='search']",
          popover: {
            title: "🔍 Search Products",
            description:
              "Search for products using the product name, brand or SKU.",
          },
        },

        {
          element: "[data-tour='cart']",
          popover: {
            title: "🛒 Shopping Cart",
            description:
              "Products you add to your cart can be reviewed here before checkout.",
          },
        },

        {
          element: "[data-tour='account']",
          popover: {
            title: "👤 My Account",
            description:
              "Access your orders, account information, KYC, address and other account features.",
          },
        },

        {
          element: "[data-tour='merchant']",
          popover: {
            title: "🏪 Sell to JCSGlobal",
            description:
              "Merchants can use this area to access their merchant dashboard and manage products.",
          },
        },

        {
          popover: {
            title: "🎉 Tour Complete",
            description:
              "You're all set! Start exploring JCS Global.",
          },
        },
      ];

      // Only use steps whose target elements exist.
      // This prevents the tour from breaking if an element
      // is temporarily unavailable.
      const availableSteps = allSteps.filter((step) => {
        if (!step.element) {
          return true;
        }

        return document.querySelector(step.element);
      });

      if (availableSteps.length === 0) {
        return;
      }

      const tour = driver({
        showProgress: true,
        animate: true,

        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Finish",

        steps: availableSteps,

        onDestroyed: () => {
          localStorage.setItem(
            "jcs_live_tour_completed",
            "true"
          );
        },
      });

      tour.drive();
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}