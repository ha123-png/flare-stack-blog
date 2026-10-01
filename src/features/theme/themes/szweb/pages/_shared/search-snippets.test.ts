import { describe, expect, it } from "vitest";
import { parseSafeSnippet } from "./search-snippets";

describe("parseSafeSnippet", () => {
  it("recognizes only the exact mark wrapper and keeps untrusted tags as text", () => {
    const segments = parseSafeSnippet(
      'before <img src=x onerror="alert(1)"> <mark>match</mark> <mark onmouseover="alert(2)">forged</mark>',
    );

    expect(segments).toEqual([
      {
        text: 'before <img src=x onerror="alert(1)"> ',
        marked: false,
      },
      { text: "match", marked: true },
      {
        text: ' <mark onmouseover="alert(2)">forged</mark>',
        marked: false,
      },
    ]);
  });

  it("decodes escaped snippets once while retaining markup as text content", () => {
    const segments = parseSafeSnippet(
      "<mark>&lt;svg onload=alert(1)&gt; &amp; &AMP; &#39; &#00039; &amp;lt;b&amp;gt;</mark>",
    );

    expect(segments).toEqual([
      {
        text: "<svg onload=alert(1)> & & ' ' &lt;b&gt;",
        marked: true,
      },
    ]);
  });

  it("does not treat unmatched or attribute-bearing markup as highlight syntax", () => {
    expect(parseSafeSnippet("<mark>unfinished <script>bad()</script>")).toEqual(
      [
        {
          text: "<mark>unfinished <script>bad()</script>",
          marked: false,
        },
      ],
    );
    expect(
      parseSafeSnippet('<mark onmouseover="alert(1)">user</mark>'),
    ).toEqual([
      {
        text: '<mark onmouseover="alert(1)">user</mark>',
        marked: false,
      },
    ]);
  });
});
