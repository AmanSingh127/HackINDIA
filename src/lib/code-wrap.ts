import type { CodingLanguage } from "@/lib/coding-round";

export function getWrappedSource(params: {
  language: CodingLanguage;
  questionId: string;
  userCode: string;
}): { fileName: string; source: string } {
  const { language, questionId, userCode } = params;

  if (language === "python") {
    const common = `
import sys
from typing import List, Tuple
    `.trim();
    if (questionId === "two-sum") {
      return {
        fileName: "main.py",
        source: `
${common}

${userCode}

def _main():
  data = sys.stdin.read().strip().split()
  n = int(data[0])
  nums = list(map(int, data[1:1+n]))
  target = int(data[1+n])
  ans = two_sum(nums, target)
  if isinstance(ans, str):
    print(ans.strip())
  else:
    i, j = ans
    print(f"{i} {j}")

if __name__ == "__main__":
  _main()
        `.trim(),
      };
    }
    if (questionId === "longest-substring") {
      return {
        fileName: "main.py",
        source: `
${common}

${userCode}

def _main():
  s = sys.stdin.read().strip()
  print(length_of_longest_substring(s))

if __name__ == "__main__":
  _main()
        `.trim(),
      };
    }
    if (questionId === "product-array") {
      return {
        fileName: "main.py",
        source: `
${common}

${userCode}

def _main():
  data = sys.stdin.read().strip().split()
  n = int(data[0])
  nums = list(map(int, data[1:1+n]))
  ans = product_except_self(nums)
  print(" ".join(map(str, ans)))

if __name__ == "__main__":
  _main()
        `.trim(),
      };
    }
  }

  if (language === "java") {
    if (questionId === "two-sum") {
      return {
        fileName: "Main.java",
        source: `
import java.io.*;
import java.util.*;

${userCode}

public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    int n = Integer.parseInt(br.readLine().trim());
    String[] parts = br.readLine().trim().split("\\\\s+");
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);
    int target = Integer.parseInt(br.readLine().trim());
    int[] ans = Solution.twoSum(nums, target);
    System.out.println(ans[0] + " " + ans[1]);
  }
}
        `.trim(),
      };
    }
    if (questionId === "longest-substring") {
      return {
        fileName: "Main.java",
        source: `
import java.io.*;
import java.util.*;

${userCode}

public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    String s = br.readLine();
    if (s == null) s = "";
    System.out.println(Solution.lengthOfLongestSubstring(s.trim()));
  }
}
        `.trim(),
      };
    }
    if (questionId === "product-array") {
      return {
        fileName: "Main.java",
        source: `
import java.io.*;
import java.util.*;

${userCode}

public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    int n = Integer.parseInt(br.readLine().trim());
    String[] parts = br.readLine().trim().split("\\\\s+");
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);
    long[] ans = Solution.productExceptSelf(nums);
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < ans.length; i++) {
      if (i > 0) sb.append(' ');
      sb.append(ans[i]);
    }
    System.out.println(sb.toString());
  }
}
        `.trim(),
      };
    }
  }

  if (language === "cpp") {
    if (questionId === "two-sum") {
      return {
        fileName: "main.cpp",
        source: `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  int n;
  cin >> n;
  vector<long long> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  long long target;
  cin >> target;
  Solution sol;
  auto ans = sol.twoSum(nums, target);
  cout << ans[0] << " " << ans[1] << "\\n";
  return 0;
}
        `.trim(),
      };
    }
    if (questionId === "longest-substring") {
      return {
        fileName: "main.cpp",
        source: `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  string s;
  cin >> s;
  Solution sol;
  cout << sol.lengthOfLongestSubstring(s) << "\\n";
  return 0;
}
        `.trim(),
      };
    }
    if (questionId === "product-array") {
      return {
        fileName: "main.cpp",
        source: `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  int n;
  cin >> n;
  vector<long long> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  Solution sol;
  auto ans = sol.productExceptSelf(nums);
  for (int i = 0; i < (int)ans.size(); i++) {
    if (i) cout << ' ';
    cout << ans[i];
  }
  cout << "\\n";
  return 0;
}
        `.trim(),
      };
    }
  }

  if (language === "c") {
    if (questionId === "two-sum") {
      return {
        fileName: "main.c",
        source: `
#include <stdio.h>
#include <stdlib.h>

${userCode}

int main() {
  int n;
  if (scanf("%d", &n) != 1) return 0;
  long long* nums = (long long*)malloc(sizeof(long long) * (size_t)n);
  for (int i = 0; i < n; i++) scanf("%lld", &nums[i]);
  long long target;
  scanf("%lld", &target);
  int i = -1, j = -1;
  two_sum(nums, n, target, &i, &j);
  printf("%d %d\\n", i, j);
  free(nums);
  return 0;
}
        `.trim(),
      };
    }
    if (questionId === "longest-substring") {
      return {
        fileName: "main.c",
        source: `
#include <stdio.h>
#include <string.h>

${userCode}

int main() {
  static char s[300005];
  if (scanf("%300000s", s) != 1) return 0;
  printf("%d\\n", length_of_longest_substring(s));
  return 0;
}
        `.trim(),
      };
    }
    if (questionId === "product-array") {
      return {
        fileName: "main.c",
        source: `
#include <stdio.h>
#include <stdlib.h>

${userCode}

int main() {
  int n;
  if (scanf("%d", &n) != 1) return 0;
  long long* nums = (long long*)malloc(sizeof(long long) * (size_t)n);
  long long* out = (long long*)malloc(sizeof(long long) * (size_t)n);
  for (int i = 0; i < n; i++) scanf("%lld", &nums[i]);
  product_except_self(nums, n, out);
  for (int i = 0; i < n; i++) {
    if (i) printf(" ");
    printf("%lld", out[i]);
  }
  printf("\\n");
  free(nums);
  free(out);
  return 0;
}
        `.trim(),
      };
    }
  }

  // Fallback: treat as a full program if unknown
  return {
    fileName:
      language === "python"
        ? "main.py"
        : language === "java"
          ? "Main.java"
          : language === "c"
            ? "main.c"
            : "main.cpp",
    source: userCode,
  };
}

