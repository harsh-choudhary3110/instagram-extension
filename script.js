const formElement = document.getElementById("form");
const inputElement = document.getElementById("userName");
const errorElement = document.getElementById("error");
const analyzeBtnElement = document.getElementById("analyzeBtn");
const analyzeBtnMessageElement = document.getElementById("analyzeBtnMessage");
const mainAlertElement = document.getElementById("mainAlert");

const outPutContainerElement = document.getElementById("outPutContainer");
const followersButtonElement = document.querySelector(
  "#followersContainer .card"
);
const followingsButtonElement = document.querySelector(
  "#followingsContainer .card"
);
const iDontFollowBackButtonElement = document.querySelector(
  "#iDontFollowBackContainer .card"
);
const dontFollowMeBackButtonElement = document.querySelector(
  "#dontFollowMeBackContainer .card"
);

const handleMainAlert = ({ type = "primary", show, message }) => {
  mainAlertElement.classList.add(`alert-${type}`);

  if (show) {
    mainAlertElement.classList.remove("d-none");
    mainAlertElement.innerHTML = message;
  } else {
    mainAlertElement.classList.add("d-none");
    mainAlertElement.innerHTML = "";
  }
};

const setInputError = (message) => {
  if (message) {
    errorElement.classList.remove("d-none");
    errorElement.innerHTML = message;
  } else {
    errorElement.classList.add("d-none");
    errorElement.innerHTML = "";
  }
};

const toggleAnalyzeBtnLoading = () => {
  const isLoading = analyzeBtnElement.getAttribute("disabled");

  if (isLoading === "true") {
    analyzeBtnElement.removeAttribute("disabled");
    analyzeBtnElement.innerHTML = "Analyze Followers & Followings";
  } else {
    analyzeBtnElement.setAttribute("disabled", "true");
    analyzeBtnElement.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> <span class="ms-2">Loading . . .</span>`;
  }
};

// apis
const searchUser = async (userNameValue) => {
  let userSearchResponse = await fetch(
    `https://www.instagram.com/web/search/topsearch/?query=${userNameValue}`
  );
  userSearchResponse = await userSearchResponse.json();

  const userId = userSearchResponse.users
    .map((item) => item.user)
    .find((item) => item.username === userNameValue)?.pk;

  return userId;
};

const getFollowersOfUser = async (userId) => {
  let followers = [];
  let cursorAfter = null;
  let hasNext = true;

  while (hasNext) {
    let followersResponse = await fetch(
      `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=` +
        encodeURIComponent(
          JSON.stringify({
            id: userId,
            include_reel: true,
            fetch_mutual: true,
            first: 50,
            after: cursorAfter,
          })
        )
    );
    followersResponse = await followersResponse.json();

    hasNext =
      followersResponse.data.user.edge_followed_by.page_info.has_next_page;
    cursorAfter =
      followersResponse.data.user.edge_followed_by.page_info.end_cursor;
    followers = followers.concat(
      followersResponse.data.user.edge_followed_by.edges.map(({ node }) => {
        return {
          userName: node.username,
          fullName: node.full_name,
          profilePicUrl: node.profile_pic_url,
        };
      })
    );
  }

  return followers;
};

const getFollowingsOfUser = async (userId) => {
  let followings = [];
  let cursorAfter = null;
  let hasNext = true;

  while (hasNext) {
    let followingsResponse = await fetch(
      `https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=` +
        encodeURIComponent(
          JSON.stringify({
            id: userId,
            include_reel: true,
            fetch_mutual: true,
            first: 50,
            after: cursorAfter,
          })
        )
    );
    followingsResponse = await followingsResponse.json();

    hasNext = followingsResponse.data.user.edge_follow.page_info.has_next_page;
    cursorAfter = followingsResponse.data.user.edge_follow.page_info.end_cursor;
    followings = followings.concat(
      followingsResponse.data.user.edge_follow.edges.map(({ node }) => {
        return {
          userName: node.username,
          fullName: node.full_name,
          profilePicUrl: node.profile_pic_url,
        };
      })
    );
  }

  return followings;
};

const setUserListInHtml = ({ containerId, listArray }) => {
  const listElement = document.querySelector(`#${containerId} .list`);

  let itemsArray = listArray.map((item) => {
    const userItemHtml = `<div class="d-flex flex-row align-items-center gap-3">
                            <img
                              src="${item.profilePicUrl}"
                              alt="Profile Picture"
                              crossorigin="anonymous"
                              class="profile-picture"
                            />
                            <div>
                              <p class="user-name m-0">${item.userName}</p>
                              <p class="text-capitalize m-0">${item.fullName}</p>
                            </div>
                          </div>`;

    return userItemHtml;
  });

  console.log(itemsArray[0]);

  const finalHtmlToInsert =
    itemsArray.length > 0
      ? itemsArray.join(" ")
      : `<p class="text-muted text-center m-0">You don't have any account here.</p>`;

  listElement.innerHTML = finalHtmlToInsert;

  // on profile picture error
  outPutContainerElement
    .querySelectorAll(".profile-picture")
    .forEach((item) => {
      item.addEventListener("error", (e) => {
        e.target.src = "images/profile-placeholder.jpg";
      });
    });
};

const handleSuccess = (
  followers,
  followings,
  iDontFollowBack,
  dontFollowMeBack
) => {
  setUserListInHtml({
    containerId: "followersContainer",
    listArray: followers,
  });
  setUserListInHtml({
    containerId: "followingsContainer",
    listArray: followings,
  });
  setUserListInHtml({
    containerId: "iDontFollowBackContainer",
    listArray: iDontFollowBack,
  });
  setUserListInHtml({
    containerId: "dontFollowMeBackContainer",
    listArray: dontFollowMeBack,
  });

  setInputError("");

  formElement.classList.add("d-none");
  outPutContainerElement.classList.remove("d-none");

  handleMainAlert({
    show: true,
    message: "Successfully Analyzed your followers & followings.",
  });
};

const analyze = async (e) => {
  e.preventDefault();

  const userNameValue = inputElement.value;

  if (!userNameValue) {
    setInputError("Please enter a username");
    return;
  }

  // let followers = [{ userName: "", fullName: "", profilePicUrl: "" }];
  // let followings = [{ userName: "", fullName: "", profilePicUrl: "" }];
  // let iDontFollowBack = [{ userName: "", fullName: "", profilePicUrl: "" }];
  // let dontFollowMeBack = [{ userName: "", fullName: "", profilePicUrl: "" }];

  toggleAnalyzeBtnLoading();
  try {
    const userId = await searchUser(userNameValue);
    if (!userId) {
      setInputError("User not found");
      return;
    }

    // set btn message after 10 seconds
    setTimeout(() => {
      analyzeBtnMessageElement.classList.remove("d-none");
      analyzeBtnMessageElement.innerHTML =
        "This may take a while, please  keep the extension open.";
    }, 10000);

    const [followers, followings] = await Promise.all([
      getFollowersOfUser(userId),
      getFollowingsOfUser(userId),
    ]);

    const iDontFollowBack = followers.filter((follower) => {
      return !followings.find(
        (following) => following.userName === follower.userName
      );
    });

    const dontFollowMeBack = followings.filter((following) => {
      return !followers.find(
        (follower) => follower.userName === following.userName
      );
    });

    handleSuccess(followers, followings, iDontFollowBack, dontFollowMeBack);
  } catch (error) {
    console.log(error);

    handleMainAlert({
      type: "danger",
      show: true,
      message:
        "Something went wrong, Please try login to instagram and then run the extension.",
    });
  } finally {
    toggleAnalyzeBtnLoading();
  }
};

formElement.addEventListener("submit", analyze);

// handle show users list
const handleShowUserList = (containerId) => {
  // hide all other lists and rotate expand icon to default
  document.querySelectorAll("#outPutContainer > div").forEach((item) => {
    if (item.id === containerId) return;

    const listElement = item.querySelector(".list");
    const expandIconEeement = item.querySelector(".expand-icon");

    listElement.classList.add("d-none");
    expandIconEeement.classList.remove("rotate-expand-icon");
  });

  // show or hider the clicked list
  const listElement = document.querySelector(`#${containerId} .list`);
  listElement.classList.toggle("d-none");

  // rotate the expand icon to up side
  const expandIconEe = document.querySelector(`#${containerId} .expand-icon`);
  expandIconEe.classList.toggle("rotate-expand-icon");
};

followersButtonElement.addEventListener("click", () =>
  handleShowUserList("followersContainer")
);
followingsButtonElement.addEventListener("click", () =>
  handleShowUserList("followingsContainer")
);
iDontFollowBackButtonElement.addEventListener("click", () =>
  handleShowUserList("iDontFollowBackContainer")
);
dontFollowMeBackButtonElement.addEventListener("click", () =>
  handleShowUserList("dontFollowMeBackContainer")
);
