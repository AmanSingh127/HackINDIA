export type CodingLanguage = "python" | "java" | "c" | "cpp";

export type CodingQuestion = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium";
  source: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
  tests: Array<{ input: string; output: string }>;
  starterByLanguage: Record<CodingLanguage, string>;
};

export const CODING_LANGUAGES: Array<{ id: CodingLanguage; label: string; monaco: string }> = [
  { id: "python", label: "Python", monaco: "python" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "c", label: "C", monaco: "c" },
  { id: "cpp", label: "C++", monaco: "cpp" },
];

export const CODING_QUESTIONS: CodingQuestion[] = [
  {
    id: "two-sum",
    title: "Two Sum (LeetCode style)",
    difficulty: "Medium",
    source: "LeetCode Inspired",
    description:
      "Given an integer array nums and an integer target, find two distinct indices i and j such that nums[i] + nums[j] == target. Print the indices in ascending order (i < j). You may assume exactly one valid answer exists.",
    inputFormat:
      "Line 1: n\nLine 2: n space-separated integers\nLine 3: target",
    outputFormat: "Two indices i j (space-separated, i < j)",
    constraints: ["2 <= n <= 100000", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9, so print indices 0 and 1.",
      },
      {
        input: "4\n3 2 4 8\n6",
        output: "1 2",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6, so print 1 2.",
      },
    ],
    tests: [
      { input: "4\n2 7 11 15\n9", output: "0 1" },
      { input: "4\n3 2 4 8\n6", output: "1 2" },
    ],
    starterByLanguage: {
      python:
        "from typing import List, Tuple\n\n# Return (i, j) where i < j\n+def two_sum(nums: List[int], target: int) -> Tuple[int, int]:\n    # TODO\n    pass\n",
      java:
        "class Solution {\n  // Return int[]{i, j} where i < j\n  public static int[] twoSum(int[] nums, int target) {\n    // TODO\n    return new int[]{0, 0};\n  }\n}\n",
      c:
        "#include <stdio.h>\n\n// Set *out_i and *out_j (0-based), ensure *out_i < *out_j\n+void two_sum(long long* nums, int n, long long target, int* out_i, int* out_j) {\n  // TODO\n+}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  // Return {i, j} where i < j\n  vector<int> twoSum(const vector<long long>& nums, long long target) {\n    // TODO\n    return {0, 0};\n  }\n};\n",
    },
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    source: "LeetCode Inspired",
    description:
      "Given a string s, print the length of the longest substring (contiguous) that contains no repeating characters.",
    inputFormat: "Line 1: string s",
    outputFormat: "Single integer answer",
    constraints: ["1 <= |s| <= 200000", "s contains only visible ASCII characters (no spaces)"],
    examples: [
      {
        input: "abcabcbb",
        output: "3",
        explanation: 'The answer is "abc" with length 3.',
      },
      {
        input: "pwwkew",
        output: "3",
        explanation: 'The answer is "wke" with length 3. Note: "pwke" is not a substring because it is not contiguous.',
      },
    ],
    tests: [
      { input: "abcabcbb", output: "3" },
      { input: "bbbbb", output: "1" },
      { input: "pwwkew", output: "3" },
    ],
    starterByLanguage: {
      python:
        "def length_of_longest_substring(s: str) -> int:\n    # TODO\n    return 0\n",
      java:
        "class Solution {\n  public static int lengthOfLongestSubstring(String s) {\n    // TODO\n    return 0;\n  }\n}\n",
      c:
        "#include <stdio.h>\n\nint length_of_longest_substring(const char* s) {\n  // TODO\n  return 0;\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  int lengthOfLongestSubstring(const string& s) {\n    // TODO\n    return 0;\n  }\n};\n",
    },
  },
  {
    id: "product-array",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    source: "LeetCode Inspired",
    description:
      "Given an integer array nums of length n, print an array output of length n where output[i] is the product of all elements of nums except nums[i].",
    inputFormat: "Line 1: n\nLine 2: n space-separated integers",
    outputFormat: "n integers space-separated",
    constraints: ["2 <= n <= 100000", "-30 <= nums[i] <= 30"],
    examples: [
      {
        input: "4\n1 2 3 4",
        output: "24 12 8 6",
        explanation:
          "output[0]=2*3*4=24, output[1]=1*3*4=12, output[2]=1*2*4=8, output[3]=1*2*3=6.",
      },
      {
        input: "5\n-1 1 0 -3 3",
        output: "0 0 9 0 0",
        explanation:
          "Because there is one zero, all positions except the zero's position become 0. At the zero's position, product is (-1)*1*(-3)*3 = 9.",
      },
    ],
    tests: [
      { input: "4\n1 2 3 4", output: "24 12 8 6" },
      { input: "5\n-1 1 0 -3 3", output: "0 0 9 0 0" },
    ],
    starterByLanguage: {
      python:
        "from typing import List\n\n# Return output array\n+def product_except_self(nums: List[int]) -> List[int]:\n    # TODO\n    return []\n",
      java:
        "class Solution {\n  // Return output array\n  public static long[] productExceptSelf(int[] nums) {\n    // TODO\n    return new long[nums.length];\n  }\n}\n",
      c:
        "#include <stdio.h>\n\n// Write results into out[0..n-1]\n+void product_except_self(long long* nums, int n, long long* out) {\n  // TODO\n+}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  vector<long long> productExceptSelf(const vector<long long>& nums) {\n    // TODO\n    return {};\n  }\n};\n",
    },
  },
  {
    id: "subarray-sum-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    source: "LeetCode Inspired",
    description:
      "Given an integer array nums and an integer k, print the number of contiguous subarrays whose sum equals k.",
    inputFormat: "Line 1: n\nLine 2: n space-separated integers\nLine 3: k",
    outputFormat: "Single integer count",
    constraints: ["1 <= n <= 200000", "-10^3 <= nums[i] <= 10^3", "-10^7 <= k <= 10^7"],
    examples: [
      {
        input: "3\n1 1 1\n2",
        output: "2",
        explanation: "Subarrays [1,1] at indices (0..1) and (1..2) sum to 2.",
      },
      {
        input: "2\n1 2\n3",
        output: "1",
        explanation: "Only subarray [1,2] sums to 3.",
      },
    ],
    tests: [
      { input: "3\n1 1 1\n2", output: "2" },
      { input: "5\n1 2 3 -2 5\n6", output: "2" },
    ],
    starterByLanguage: {
      python:
        "from typing import List\n\n# Return count of subarrays with sum k\n+def subarray_sum(nums: List[int], k: int) -> int:\n    # TODO\n    return 0\n",
      java:
        "class Solution {\n  public static long subarraySum(int[] nums, int k) {\n    // TODO\n    return 0L;\n  }\n}\n",
      c:
        "#include <stdio.h>\n\nlong long subarray_sum(long long* nums, int n, long long k) {\n  // TODO\n  return 0;\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  long long subarraySum(const vector<long long>& nums, long long k) {\n    // TODO\n    return 0;\n  }\n};\n",
    },
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    source: "LeetCode Inspired",
    description:
      "Given a list of intervals, merge all overlapping intervals and print the merged intervals sorted by start time.",
    inputFormat: "Line 1: n\nNext n lines: start end",
    outputFormat: "m (number of merged intervals) on first line, then m lines: start end",
    constraints: ["1 <= n <= 200000", "-10^9 <= start <= end <= 10^9"],
    examples: [
      {
        input: "4\n1 3\n2 6\n8 10\n15 18",
        output: "3\n1 6\n8 10\n15 18",
        explanation: "[1,3] overlaps [2,6] so they merge to [1,6].",
      },
    ],
    tests: [
      { input: "4\n1 3\n2 6\n8 10\n15 18", output: "3\n1 6\n8 10\n15 18" },
      { input: "3\n1 4\n4 5\n7 9", output: "2\n1 5\n7 9" },
    ],
    starterByLanguage: {
      python:
        "from typing import List, Tuple\n\n# Return merged intervals as list of (start, end)\n+def merge_intervals(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:\n    # TODO\n    return []\n",
      java:
        "import java.util.*;\n\nclass Solution {\n  // intervals[i] = {start, end}\n  public static int[][] mergeIntervals(int[][] intervals) {\n    // TODO\n    return new int[0][0];\n  }\n}\n",
      c:
        "#include <stdio.h>\n\n// intervals: 2D array flattened [n][2] => intervals[2*i], intervals[2*i+1]\n+// Write merged into out (same format), return merged count\n+int merge_intervals(long long* intervals, int n, long long* out) {\n  // TODO\n  return 0;\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  vector<pair<long long,long long>> mergeIntervals(vector<pair<long long,long long>> intervals) {\n    // TODO\n    return {};\n  }\n};\n",
    },
  },
];

export function getPistonLanguage(language: CodingLanguage): string {
  switch (language) {
    case "python":
      return "python";
    case "java":
      return "java";
    case "c":
      return "c";
    case "cpp":
      return "cpp";
    default:
      return "python";
  }
}
