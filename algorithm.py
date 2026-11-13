"""
algorithm.py - Find the minimum and maximum of an array with Divide and Conquer.

Design Analysis and Algorithm project.

This file has two parts:

  PART 1  min_max()      The clean algorithm. Read this one when you explain the code.
  PART 2  build_trace()  The same algorithm, but it also records every step so the
                         web page (index.html) can draw the tree and write the solution.

Run it from the terminal:
    python algorithm.py 38 12 77 5 41 90 23 66
Run the self-test:
    python algorithm.py --test
"""

from __future__ import annotations

import json
import math
import random
import sys
from typing import Any


# =====================================================================
# PART 1 - THE ALGORITHM
# =====================================================================

def min_max(a, low, high, count):
    """Return (minimum, maximum) of a[low..high].

    count is a list with one number, count[0]. We add 1 to it every time two
    array values are compared. That is how we count comparisons.
    """
    # Case 1: only one element. It is both the min and the max. No comparison.
    if low == high:
        return a[low], a[low]

    # Case 2: exactly two elements. One comparison is enough for both answers.
    if high == low + 1:
        count[0] += 1                      # the one comparison
        if a[low] <= a[high]:
            return a[low], a[high]         # (min, max)
        return a[high], a[low]

    # DIVIDE: cut the part in the middle.
    mid = (low + high) // 2

    # CONQUER: solve the left half and the right half with the same function.
    min1, max1 = min_max(a, low, mid, count)
    min2, max2 = min_max(a, mid + 1, high, count)

    # COMBINE: two comparisons join the two answers.
    count[0] += 1                          # compare the two minimums
    smallest = min1 if min1 <= min2 else min2
    count[0] += 1                          # compare the two maximums
    largest = max1 if max1 >= max2 else max2
    return smallest, largest


def find_min_max(values):
    """Check the input, run min_max() and return a small result dictionary."""
    arr = validate(values)
    count = [0]
    smallest, largest = min_max(arr, 0, len(arr) - 1, count)
    return {
        "array": arr,
        "minimum": smallest,
        "maximum": largest,
        "comparisons": count[0],
        "expected_comparisons": theoretical_comparisons(len(arr)),
        "scan_comparisons": scan_comparisons(len(arr)),
    }


def validate(values):
    """Accept a non-empty list of whole numbers, otherwise raise ValueError."""
    if values is None or len(values) == 0:
        raise ValueError("Enter at least one whole number.")
    out = []
    for v in values:
        if isinstance(v, bool) or not isinstance(v, int):
            raise ValueError(f"'{v}' is not a whole number.")
        out.append(v)
    return out


# ---- the formulas we compare against ---------------------------------

def theoretical_comparisons(n):
    """T(1)=0, T(2)=1, T(n)=T(ceil(n/2)) + T(floor(n/2)) + 2.

    For n = 2^k this equals 3n/2 - 2.
    """
    if n == 1:
        return 0
    if n == 2:
        return 1
    return theoretical_comparisons(math.ceil(n / 2)) + theoretical_comparisons(n // 2) + 2


def scan_comparisons(n):
    """The simple loop compares every other element twice: 2(n - 1)."""
    return 2 * (n - 1)


def lower_bound(n):
    """No comparison-based method can use fewer than ceil(3n/2) - 2 (n >= 2)."""
    return 0 if n <= 1 else math.ceil(3 * n / 2) - 2


# =====================================================================
# PART 2 - THE SAME ALGORITHM, WITH A STEP-BY-STEP TRACE FOR THE WEB PAGE
# =====================================================================
# The page shows a "solution" line for every step. The text, the pseudocode
# line numbers and the field names are the same ones the JavaScript engine in
# app.js produces, so the page can use either engine.

def build_trace(values):
    arr = validate(values)
    events: list[dict[str, Any]] = []
    nodes: list[dict[str, Any]] = []
    state = {"comps": 0, "calls": 0, "max_depth": 0}

    def rng(lo, hi):
        return f"A[{lo}]" if lo == hi else f"A[{lo}..{hi}]"

    def lst(a):
        return "[" + ", ".join(str(x) for x in a) + "]"

    def ev(kind, node, **fields):
        events.append({"idx": len(events), "type": kind, "node": node["id"],
                       "comps": state["comps"], "calls": state["calls"], **fields})

    def solve(lo, hi, depth, parent, side):
        n = hi - lo + 1
        node = {"id": len(nodes), "parent": parent["id"] if parent else -1, "side": side,
                "depth": depth, "lo": lo, "hi": hi, "n": n, "vals": arr[lo:hi + 1], "kids": [],
                "kind": "single" if n == 1 else "pair" if n == 2 else "split",
                "min": None, "max": None, "minI": -1, "maxI": -1}
        nodes.append(node)
        if parent:
            parent["kids"].append(node["id"])
        state["calls"] += 1
        state["max_depth"] = max(state["max_depth"], depth)

        where = (("left half" if side == "L" else "right half") + f", depth {depth}") if parent else "whole array"
        ev("enter", node, tag="CALL", line=[1] + ([9 if side == "L" else 10] if parent else []),
           text=f"FIND-MIN-MAX on <b>{rng(lo, hi)}</b> = {lst(node['vals'])} <i>({where})</i>")

        # one element
        if n == 1:
            node["min"] = node["max"] = arr[lo]
            node["minI"] = node["maxI"] = lo
            ev("single", node, tag="BASE", line=[2, 3], min=arr[lo], max=arr[lo], minI=lo, maxI=lo,
               text=f"One element: <b>{arr[lo]}</b> is both min and max. <i>0 comparisons</i>")
            return node

        # two elements
        if n == 2:
            state["comps"] += 1
            a, b = arr[lo], arr[hi]
            le = a <= b
            node["min"], node["max"] = (a, b) if le else (b, a)
            node["minI"], node["maxI"] = (lo, hi) if le else (hi, lo)
            ev("pair", node, tag="COMPARE", line=[4, 5, 6 if le else 7], cmp=[lo, hi],
               min=node["min"], max=node["max"], minI=node["minI"], maxI=node["maxI"],
               text=(f"Compare <b>{a}</b> {'≤' if le else '>'} <b>{b}</b> → min = <b>{node['min']}</b>, "
                     f"max = <b>{node['max']}</b> <span class=\"cnt\">comparison #{state['comps']}</span>"))
            return node

        # divide
        mid = (lo + hi) // 2
        ev("divide", node, tag="DIVIDE", line=[8], mid=mid,
           text=(f"mid = ⌊({lo}+{hi})/2⌋ = <b>{mid}</b> → left {rng(lo, mid)} = {lst(arr[lo:mid + 1])}, "
                 f"right {rng(mid + 1, hi)} = {lst(arr[mid + 1:hi + 1])}"))

        # conquer
        left = solve(lo, mid, depth + 1, node, "L")
        right = solve(mid + 1, hi, depth + 1, node, "R")

        # combine: minimum
        state["comps"] += 1
        take_left = left["min"] <= right["min"]
        node["min"] = left["min"] if take_left else right["min"]
        node["minI"] = left["minI"] if take_left else right["minI"]
        ev("cmin", node, tag="COMBINE", line=[11], cmp=[left["minI"], right["minI"]],
           pickMin=node["minI"], partialMin=node["min"], kidL=left["id"], kidR=right["id"],
           text=(f"MIN: left <b>{left['min']}</b> {'≤' if take_left else '>'} right <b>{right['min']}</b> "
                 f"→ min = <b>{node['min']}</b> <span class=\"cnt\">comparison #{state['comps']}</span>"))

        # combine: maximum
        state["comps"] += 1
        take_left = left["max"] >= right["max"]
        node["max"] = left["max"] if take_left else right["max"]
        node["maxI"] = left["maxI"] if take_left else right["maxI"]
        ev("cmax", node, tag="COMBINE", line=[12], cmp=[left["maxI"], right["maxI"]],
           pickMax=node["maxI"], partialMax=node["max"], kidL=left["id"], kidR=right["id"],
           text=(f"MAX: left <b>{left['max']}</b> {'≥' if take_left else '<'} right <b>{right['max']}</b> "
                 f"→ max = <b>{node['max']}</b> <span class=\"cnt\">comparison #{state['comps']}</span>"))

        ev("done", node, tag="SOLVED", line=[13], min=node["min"], max=node["max"],
           minI=node["minI"], maxI=node["maxI"],
           text=f"{rng(lo, hi)} solved → min = <b>{node['min']}</b>, max = <b>{node['max']}</b>")
        return node

    root = solve(0, len(arr) - 1, 0, None, "")
    n = len(arr)
    ev("final", root, tag="RESULT", line=[], min=root["min"], max=root["max"],
       minI=root["minI"], maxI=root["maxI"],
       text=(f"Answer: min = <b>{root['min']}</b>, max = <b>{root['max']}</b> using "
             f"<span class=\"cnt\">{state['comps']} comparisons</span> "
             f"<i>(recurrence T({n}) = {theoretical_comparisons(n)}, scan 2(n−1) = {scan_comparisons(n)})</i>"))
    return {"arr": arr, "events": events, "nodes": nodes, "total": state["comps"],
            "calls": state["calls"], "maxDepth": state["max_depth"]}


# =====================================================================
# SELF TEST AND COMMAND LINE
# =====================================================================

def self_test(runs=5000):
    """Check min, max, indices and the comparison count on many random arrays."""
    rnd = random.Random(2026)
    for _ in range(runs):
        n = rnd.randint(1, 60)
        span = rnd.choice([3, 100])
        arr = [rnd.randint(-span, span) for _ in range(n)]
        r = find_min_max(arr)
        t = build_trace(arr)
        assert r["minimum"] == min(arr) and r["maximum"] == max(arr), arr
        assert r["comparisons"] == theoretical_comparisons(n) == t["total"], arr
        assert arr[t["nodes"][0]["minI"]] == min(arr) and arr[t["nodes"][0]["maxI"]] == max(arr), arr
        assert r["comparisons"] >= lower_bound(n), arr
        if n >= 2 and (n & (n - 1)) == 0:
            assert r["comparisons"] == 3 * n // 2 - 2, arr
    return runs


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print(f"All {self_test()} random arrays passed.")
    elif len(sys.argv) > 1 and sys.argv[1] == "--json":
        print(json.dumps(build_trace([int(x) for x in sys.argv[2:]]), ensure_ascii=False))
    else:
        nums = [int(x) for x in sys.argv[1:]] or [38, 12, 77, 5, 41, 90, 23, 66]
        res = find_min_max(nums)
        print("Array              :", res["array"])
        print("Minimum            :", res["minimum"])
        print("Maximum            :", res["maximum"])
        print("Comparisons (D&C)  :", res["comparisons"], "  (formula T(n) =", res["expected_comparisons"], ")")
        print("Comparisons (scan) :", res["scan_comparisons"])
