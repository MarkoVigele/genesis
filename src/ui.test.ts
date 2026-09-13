import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DONATE_HINT,
  DONATE_HREF,
  DONATE_LABEL,
  donateMarkup,
  playLabel,
} from "./ui";

test("play labels stay German and distinct for each transport state", () => {
  assert.equal(playLabel(true, false), "Pause");
  assert.equal(playLabel(false, false), "Abspielen");
  assert.equal(playLabel(false, true), "Von vorn");
  assert.equal(playLabel(true, true), "Von vorn");
});

test("donate chip uses the final German CTA and a Payment Link only", () => {
  assert.equal(DONATE_LABEL, "Projekt unterstützen");
  assert.equal(
    DONATE_HINT,
    "Demos bleiben free. Wenn du willst, kannst du das Studio kurz unterstützen.",
  );
  assert.equal(
    DONATE_HREF,
    "https://donate.stripe.com/eVqfZif6m8veaTEftLeEo00?client_reference_id=genesis",
  );
  assert.match(DONATE_HREF, /^https:\/\/donate\.stripe\.com\//);
  assert.match(DONATE_HREF, /[?&]client_reference_id=genesis(?:&|$)/);
  assert.doesNotMatch(`${DONATE_LABEL}${DONATE_HINT}`, /—|–/);
  assert.doesNotMatch(DONATE_HINT, /Freiwillige Spende/);

  const markup = donateMarkup();
  assert.match(markup, /class="donate"/);
  assert.match(markup, /id="donate"/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener"/);
  assert.doesNotMatch(markup, /rel="[^"]*noreferrer/);
  assert.ok(markup.includes(`href="${DONATE_HREF}"`));
  assert.ok(markup.includes(DONATE_LABEL));
  assert.ok(markup.includes(DONATE_HINT));
  assert.doesNotMatch(markup, /js\.stripe\.com|Stripe\(|pk_live|sk_live|rk_live/);
});
