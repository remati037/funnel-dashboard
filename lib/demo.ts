import { CURRENCY } from "./config";
import type { Site } from "./sites";

/**
 * Demo podaci za lokalni razvoj bez ključeva sajtova.
 * Stranice su prave (nemanjaantic.com), brojevi su izmišljeni.
 */
const B = "https://nemanjaantic.com";
export const DEMO_HOSTS = ["nemanjaantic.com"];

type S = [type: string, name: string, path: string | null, views: number, conversions: number, price: number];

function funnel(id: number, name: string, steps: S[]) {
  return {
    id: "s0-" + id,
    fid: id,
    name,
    steps: steps.map(([type, n, path, views, conversions, price], i) => ({
      type,
      step_id: id * 100 + i,
      name: n,
      views,
      conversions,
      revenue: Math.round(conversions * price * 100) / 100,
      links: path ? { view: B + path } : {},
    })),
  };
}

export function demoSite(): Site {
  const site: Site = {
    id: "s0",
    plugin_version: "demo",
    hides_drafts: true,
    src: B,
    name: "DEMO · Antić",
    url: "nemanjaantic.com",
    currency: CURRENCY,
    rate: 1,
    funnels: [
      funnel(1, "Kralj pasivnog prihoda", [
        ["landing", "Sales page", "/sp/kralj-pasivnog-prihoda/", 3100, 620, 0],
        ["checkout", "Checkout", "/checkouts/kpp-checkout/", 620, 248, 47],
        ["bump", "Order bump: Radna sveska", null, 248, 40, 19],
        ["bump", "Order bump: Audio verzija", null, 248, 22, 15],
        ["upsell", "Upsell: Kako da tvoj novac radi za tebe", "/offer/kako-da-tvoj-novac-radi-za-tebe-na-rate-kpp2/", 248, 11, 77],
        ["thankyou", "Hvala", "/order-confirmed/kpp-thank-you/", 248, 0, 0],
      ]),
      funnel(2, "Od garaže do solitera", [
        ["landing", "Sales page", "/sp/od-garaze-do-solitera/", 5200, 980, 0],
        ["checkout", "Checkout", "/checkouts/od-garaze-do-solitera-checkout/", 980, 210, 37],
        ["bump", "Order bump: Kontrolna lista", null, 210, 58, 17],
        ["upsell", "Upsell: Kako da tvoj novac radi za tebe", "/offer/kako-da-tvoj-novac-radi-za-tebe/", 210, 19, 77],
        ["thankyou", "Hvala", "/order-confirmed/od-garaze-do-solitera-thank-you/", 210, 0, 0],
      ]),
      funnel(3, "E-commerce biznis za 30 dana", [
        ["landing", "Sales page", "/sp/e-commerce-biznis-za-30-dana/", 2400, 130, 0],
        ["checkout", "Checkout", "/checkouts/checkout-e-commerce/", 130, 52, 97],
        ["thankyou", "Hvala", "/order-confirmed/thank-you-e-commerce/", 52, 0, 0],
      ]),
      funnel(4, "Pametne finansijske navike", [
        ["landing", "Sales page", "/sp/pametne-finansijske-navike/", 1800, 300, 0],
        ["checkout", "Checkout", "/checkouts/checkout-pametne-finansijske-navike/", 300, 45, 27],
        ["bump", "Order bump: Budžet tabela", null, 45, 14, 9],
        ["thankyou", "Hvala", "/order-confirmed/thank-you-kartica-pfn/", 45, 0, 0],
      ]),
    ],
  };
  site.funnels[0].drafts_hidden = 1; // primer oznake za skrivene draft korake
  return site;
}
