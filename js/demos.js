define([], function () {
  var free = {
    title: "Free Explore",
    key: "free",
    message: "Test out 'commit', 'branch', and 'checkout'",
    commitData: [{ id: "abc1234", tags: ["main"], message: "first commit" }],
  };

  var freeWithRemote = {
    title: "Free Explore with Remote",
    key: "free-remote",
    message: "Have fun!",
    commitData: [
      { id: "abc1234", tags: ["main", "origin/main"], message: "first commit" },
    ],
    originData: [{ id: "abc1234", tags: ["main"], message: "first commit" }],
  };

  var mergeExample = {
    title: "Merge Example",
    key: "merge-example",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 369,
        branchless: false,
      },
      {
        id: "818b21c",
        tags: ["main", "HEAD"],
        parent: "abc1234",
        cx: 140,
        cy: 369,
        branchless: false,
      },
      {
        id: "5fb6bcc",
        tags: [],
        parent: "818b21c",
        cx: 230,
        cy: 369,
        branchless: false,
      },
      {
        id: "dcfc607",
        tags: ["feature-1"],
        parent: "5fb6bcc",
        cx: 320,
        cy: 369,
        branchless: false,
      },
      {
        id: "15ec1bd",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 279,
        branchless: false,
      },
      {
        id: "0f2baaf",
        tags: [],
        parent: "15ec1bd",
        cx: 230,
        cy: 279,
        branchless: false,
      },
      {
        id: "b1ecc95",
        tags: ["feature-2"],
        parent: "0f2baaf",
        cx: 320,
        cy: 279,
        branchless: false,
      },
    ],
    currentBranch: "main",
  };

  var rewrittenHistory = {
    title: "Rewritten Remote History",
    key: "rewritten-history",
    message: "Someone force-pushed and re-wrote history on the remote!",
    currentBranch: "feature",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 437,
        branchless: false,
      },
      {
        id: "267c628",
        tags: ["main", "origin/main"],
        parent: "abc1234",
        cx: 140,
        cy: 437,
        branchless: false,
      },
      {
        id: "94b5af7",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 347,
        branchless: false,
      },
      {
        id: "4aca73f",
        tags: ["feature", "origin/feature", "HEAD"],
        parent: "94b5af7",
        cx: 230,
        cy: 347,
        branchless: false,
      },
    ],
    originData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 360,
        branchless: false,
      },
      {
        id: "267c628",
        tags: ["main"],
        parent: "abc1234",
        cx: 140,
        cy: 360,
        branchless: false,
      },
      {
        id: "4aca73f",
        tags: [],
        parent: "94b5af7",
        cx: 230,
        cy: 270,
        branchless: true,
      },
      {
        id: "94b5af7",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 270,
        branchless: false,
      },
      {
        id: "0c5bda6",
        tags: ["feature", "HEAD"],
        message: "force push",
        parent: "94b5af7",
        cx: 230,
        cy: 180,
        branchless: false,
      },
    ],
  };

  var fetchAndPull = {
    title: "Fetch + Pull",
    key: "fetch-pull",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 437,
        branchless: false,
      },
      {
        id: "2c85fc6",
        tags: ["main", "HEAD", "origin/main"],
        parent: "abc1234",
        cx: 140,
        cy: 437,
        branchless: false,
      },
    ],
    currentBranch: "main",
    originData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 360,
        branchless: false,
      },
      {
        id: "2c85fc6",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 360,
        branchless: false,
      },
      {
        id: "4d791cb",
        tags: [],
        parent: "2c85fc6",
        cx: 230,
        cy: 360,
        branchless: false,
      },
      {
        id: "aa50ff9",
        tags: ["main", "HEAD"],
        parent: "4d791cb",
        cx: 320,
        cy: 360,
        branchless: false,
      },
    ],
  };

  var pullRebase = {
    title: "Pull --rebase",
    key: "pull-rebase",
    message:
      "You committed locally after an update was pushed to the remote. What happens if you try and pull?",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 437,
        branchless: false,
      },
      {
        id: "1ee0de4",
        tags: ["origin/main"],
        parent: "abc1234",
        cx: 140,
        cy: 437,
        branchless: false,
      },
      {
        id: "3d6b327",
        tags: ["main", "HEAD"],
        message: "matt's change",
        parent: "1ee0de4",
        cx: 230,
        cy: 437,
        branchless: false,
      },
    ],
    currentBranch: "main",
    originData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 360,
        branchless: false,
      },
      {
        id: "1ee0de4",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 360,
        branchless: false,
      },
      {
        id: "e487ba3",
        tags: ["main", "HEAD"],
        message: "bill's change",
        parent: "1ee0de4",
        cx: 230,
        cy: 360,
        branchless: false,
      },
    ],
  };

  var resetExample = {
    title: "Reset Example",
    key: "reset",
    message: "Try performing hard resets on `main` to various commits",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 437,
        branchless: false,
      },
      {
        id: "1111111",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 437,
        branchless: false,
      },
      {
        id: "2222222",
        tags: [],
        parent: "1111111",
        cx: 230,
        cy: 347,
        branchless: false,
        isNoFFBranch: true,
      },
      {
        id: "3333333",
        tags: [],
        parent: "2222222",
        cx: 320,
        cy: 347,
        branchless: false,
      },
      {
        id: "4444444",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 527,
        branchless: false,
        isNoFFBranch: true,
      },
      {
        id: "5555555",
        tags: [],
        parent: "4444444",
        cx: 230,
        cy: 527,
        branchless: false,
      },
      {
        id: "6666666",
        tags: [],
        parent: "5555555",
        cx: 320,
        cy: 527,
        branchless: false,
      },
      {
        parent2: "3333333",
        isNoFFCommit: true,
        id: "7777777",
        tags: [],
        message: "Merge",
        parent: "1111111",
        cx: 410,
        cy: 437,
        branchless: false,
      },
      {
        parent2: "6666666",
        isNoFFCommit: true,
        id: "8888888",
        tags: ["main", "HEAD"],
        message: "Merge",
        parent: "7777777",
        cx: 500,
        cy: 437,
        branchless: false,
      },
    ],
    currentBranch: "main",
  };

  var cherryPick = {
    title: "Cherry Pick",
    key: "cherry-pick",
    message: "Let's pick some commits",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 318,
        branchless: false,
      },
      {
        id: "790dd94",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 318,
        branchless: false,
      },
      {
        id: "96e9ce7",
        tags: ["[bugfix1]"],
        parent: "790dd94",
        cx: 230,
        cy: 318,
        branchless: false,
      },
      {
        id: "44db644",
        tags: [],
        parent: "96e9ce7",
        cx: 320,
        cy: 318,
        branchless: false,
      },
      {
        id: "06127d7",
        tags: [],
        parent: "44db644",
        cx: 410,
        cy: 318,
        branchless: false,
      },
      {
        id: "60c6c2c",
        tags: [],
        parent: "790dd94",
        cx: 230,
        cy: 228,
        branchless: false,
      },
      {
        id: "8f7c801",
        tags: ["release", "HEAD"],
        parent: "60c6c2c",
        cx: 320,
        cy: 228,
        branchless: false,
      },
      {
        id: "78ecb32",
        tags: [],
        parent: "44db644",
        cx: 410,
        cy: 228,
        branchless: false,
      },
      {
        id: "12e9bbb",
        tags: ["bugfix2"],
        parent: "78ecb32",
        cx: 500,
        cy: 228,
        branchless: false,
      },
      {
        id: "e8ce346",
        tags: [],
        parent: "06127d7",
        cx: 500,
        cy: 318,
        branchless: false,
      },
      {
        parent2: "12e9bbb",
        id: "5749661",
        tags: ["main"],
        message: "Merge",
        parent: "e8ce346",
        cx: 590,
        cy: 318,
        branchless: false,
      },
    ],
  };

  var rebaseExample = {
    title: "Rebase Example",
    key: "rebase-example",
    message: "Try rebasing the `feature` branch onto `main`",
    commitData: [
      {
        id: "abc1234",
        tags: [],
        message: "first commit",
        parent: "initial",
        cx: 50,
        cy: 437,
        branchless: false,
      },
      {
        id: "4c7f2da",
        tags: [],
        parent: "abc1234",
        cx: 140,
        cy: 437,
        branchless: false,
      },
      {
        id: "1fbf33c",
        tags: ["main"],
        message: "important hotfix",
        parent: "4c7f2da",
        cx: 230,
        cy: 437,
        branchless: false,
      },
      {
        id: "44631d2",
        tags: [],
        parent: "4c7f2da",
        cx: 230,
        cy: 347,
        branchless: false,
      },
      {
        id: "9431439",
        tags: [],
        parent: "44631d2",
        cx: 320,
        cy: 347,
        branchless: false,
      },
      {
        id: "683a437",
        tags: ["feature", "HEAD"],
        parent: "9431439",
        cx: 410,
        cy: 347,
        branchless: false,
      },
    ],
    currentBranch: "feature",
  };

  return [
    free,
    freeWithRemote,
    mergeExample,
    resetExample,
    fetchAndPull,
    rebaseExample,
    pullRebase,
    rewrittenHistory,
    cherryPick,
  ];
});
