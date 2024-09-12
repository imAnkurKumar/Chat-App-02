document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    createGroupBtn: document.querySelector(".create-group-btn"),
    groupsList: document.getElementById("groups"),
    messageInput: document.getElementById("message-input"),
    sendBtn: document.querySelector(".send-btn"),
    chatMessages: document.getElementById("chat-messages"),
    menuBtn: document.querySelector(".menu-btn"),
    dropdownMenu: document.getElementById("dropdown-menu"),
    addGroupBtn: document.querySelector(".add-group-btn"),
    makeAdminBtn: document.querySelector(".make-admin-btn"),
    removeGroupBtn: document.querySelector(".remove-group-btn"),
    groupNameDisplay: document.getElementById("group-name"),
    groupMembersModal: document.getElementById("group-members-modal"),
    groupMembersList: document.getElementById("group-members-list"),
    closeBtn: document.querySelector(".close-btn"),
  };

  const token = localStorage.getItem("token");
  const headers = { Authorization: token };
  let selectedGroupId = null;
  let messageInterval = null;

  // Fetch and display groups when the page loads
  async function loadGroups() {
    try {
      const { data } = await axios.get("/chat/groups", { headers });
      elements.groupsList.innerHTML = "";
      data.groups.forEach((group) => createGroupElement(group));
      addGroupClickListeners();
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  }

  function createGroupElement(group) {
    const li = document.createElement("li");
    li.textContent = group.name;
    li.dataset.groupId = group.id;
    li.classList.add("group-item");
    elements.groupsList.appendChild(li);
  }

  function addGroupClickListeners() {
    document.querySelectorAll(".group-item").forEach((item) =>
      item.addEventListener("click", () => {
        selectGroup(item);
      })
    );
  }

  function selectGroup(item) {
    document
      .querySelectorAll(".group-item")
      .forEach((group) => group.classList.remove("active"));
    item.classList.add("active");
    selectedGroupId = item.dataset.groupId;
    elements.groupNameDisplay.textContent = item.textContent;

    // Clear the old interval and start a new one for the selected group
    if (messageInterval) {
      clearInterval(messageInterval);
    }
    loadMessages(selectedGroupId);
    messageInterval = setInterval(() => loadMessages(selectedGroupId), 3000); // Refresh every 3 seconds
  }

  async function loadMessages(groupId) {
    try {
      const { data } = await axios.get(`/chat/groups/${groupId}/messages`, {
        headers,
      });
      elements.chatMessages.innerHTML = "";
      data.messages.forEach((message) => appendMessageToChat(message));
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }

  function appendMessageToChat(message) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("message");
    messageElem.textContent = `${message.name}: ${message.content}`;
    elements.chatMessages.appendChild(messageElem);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // Event Listeners
  elements.createGroupBtn.addEventListener("click", createGroup);
  elements.addGroupBtn.addEventListener("click", addUserToGroup);
  elements.sendBtn.addEventListener("click", sendMessage);
  elements.menuBtn.addEventListener("click", toggleDropdownMenu);
  elements.groupNameDisplay.addEventListener("click", showGroupMembers); // Add click listener for group name
  elements.closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", closeDropdownMenuOnClickOutside);

  elements.removeGroupBtn.addEventListener("click", () => {
    if (!selectedGroupId) return alert("Please select a group first.");

    showMembersForRemoval();
  });

  async function showMembersForRemoval() {
    try {
      const { data } = await axios.get(
        `/chat/groups/${selectedGroupId}/members`,
        { headers }
      );
      elements.groupMembersList.innerHTML = "";

      data.members.forEach((member) => {
        const li = document.createElement("li");
        li.textContent = member.name;
        li.dataset.userId = member.id;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("remove-member-btn");
        removeBtn.addEventListener("click", () => {
          removeMemberFromGroup(member.id);
        });

        li.appendChild(removeBtn);
        elements.groupMembersList.appendChild(li);
      });

      elements.groupMembersModal.style.display = "block";
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  }

  async function removeMemberFromGroup(userId) {
    if (!selectedGroupId || !userId)
      return alert("Missing group or user information.");

    try {
      const { data } = await axios.delete(
        `/chat/groups/${selectedGroupId}/remove-user/${userId}`,
        { headers }
      );
      alert(data.message);
      // Refresh the member list after removing
      showMembersForRemoval();
    } catch (err) {
      console.error("Error removing member from group:", err);
      alert(
        err.response && err.response.data
          ? err.response.data.message
          : "Failed to remove member"
      );
    }
  }

  // Event listener for the "Make Admin" button
  elements.makeAdminBtn.addEventListener("click", () => {
    if (!selectedGroupId) {
      return alert("Please select a group first.");
    }

    const userEmail = prompt(
      "Enter the email of the user you want to make admin:"
    );
    if (userEmail) {
      axios
        .post(
          `/chat/groups/${selectedGroupId}/make-admin`,
          { userEmail },
          { headers }
        )
        .then(({ data }) => alert(data.message))
        .catch(handleMakeAdminError);
    }
  });

  // Function to handle errors during the "Make Admin" request
  function handleMakeAdminError(error) {
    const errorMsg =
      error.response && error.response.data
        ? error.response.data.message
        : "Error making user admin";
    alert(errorMsg);
  }

  // Close modal
  elements.closeBtn.addEventListener("click", () => {
    elements.groupMembersModal.style.display = "none";
  });

  async function createGroup() {
    const groupName = prompt("Enter a group name:");
    if (!groupName) return alert("Group name cannot be empty.");

    try {
      const { data } = await axios.post(
        "/chat/groups",
        { name: groupName },
        { headers }
      );
      createGroupElement(data.group);
      addGroupClickListeners();
      alert("Group created successfully!");
    } catch (err) {
      handleGroupCreationError(err);
    }
  }

  function handleGroupCreationError(err) {
    console.error("Error creating group:", err);
    if (err.response && err.response.status === 400) {
      alert("Group name already exists!");
    } else {
      alert("Failed to create group. Please try again.");
    }
  }

  function addUserToGroup() {
    if (!selectedGroupId) return alert("Please select a group first.");

    const userEmail = prompt("Enter the email of the user you want to add:");
    if (userEmail) {
      axios
        .post(
          `/chat/groups/${selectedGroupId}/add-user`,
          { userEmail },
          { headers }
        )
        .then(({ data }) => alert(data.message))
        .catch(handleAddUserError);
    }
  }

  function handleAddUserError(error) {
    const errorMsg =
      error.response && error.response.data
        ? error.response.data.message
        : "Error adding user to group";
    alert(errorMsg);
  }

  async function sendMessage() {
    const message = elements.messageInput.value;
    if (!message || !selectedGroupId)
      return alert("Please select a group and enter a message.");

    try {
      const { data } = await axios.post(
        `/chat/groups/${selectedGroupId}/messages`,
        { content: message },
        { headers }
      );
      elements.messageInput.value = "";
      appendMessageToChat(data.message);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  async function showGroupMembers() {
    if (!selectedGroupId) return;

    try {
      const { data } = await axios.get(
        `/chat/groups/${selectedGroupId}/members`,
        { headers }
      );
      elements.groupMembersList.innerHTML = "";
      data.members.forEach((member) => {
        const li = document.createElement("li");
        li.textContent = member.name;
        elements.groupMembersList.appendChild(li);
      });

      elements.groupMembersModal.style.display = "block"; // Show the modal
    } catch (err) {
      console.error("Error loading group members:", err);
    }
  }

  function closeModal() {
    elements.groupMembersModal.style.display = "none";
  }

  function toggleDropdownMenu() {
    elements.dropdownMenu.style.display =
      elements.dropdownMenu.style.display === "block" ? "none" : "block";
  }

  function closeDropdownMenuOnClickOutside(e) {
    if (!e.target.matches(".menu-btn") && !e.target.closest(".dropdown-menu")) {
      elements.dropdownMenu.style.display = "none";
    }
  }

  loadGroups();
});
