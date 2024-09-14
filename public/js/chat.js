document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
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
    fileInput: document.getElementById("file-input"),
    groupNameDisplay: document.getElementById("group-name"),
    groupMembersModal: document.getElementById("group-members-modal"),
    groupMembersList: document.getElementById("group-members-list"),
    closeBtn: document.querySelector(".close-btn"),
  };

  const token = localStorage.getItem("token");
  const headers = { Authorization: token };
  let selectedGroupId = null;

  function decodeToken(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  }

  const decodedToken = decodeToken(token);
  console.log(decodedToken);
  const userId = decodedToken.id;
  const name = decodedToken.name;

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

    joinGroup(selectedGroupId);
    loadMessages(selectedGroupId);
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
    if (message.content.includes("http")) {
      messageElem.innerHTML = `<a href="${message.content}" target="_blank">${message.name} shared a file</a>`;
    } else {
      messageElem.textContent = `${message.name}: ${message.content}`;
    }
    elements.chatMessages.appendChild(messageElem);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function joinGroup(groupId) {
    socket.emit("joinGroup", groupId);
  }

  elements.sendBtn.addEventListener("click", () => {
    const messageContent = elements.messageInput.value;
    if (!messageContent || !selectedGroupId) {
      return alert("Please select a group and enter a message.");
    }

    const messageData = {
      groupId: selectedGroupId,
      message: {
        content: messageContent,
        name: name, // Replace with actual user name
        userId: userId,
      },
    };

    // Emit the message via Socket.IO
    socket.emit("sendMessage", messageData);
    elements.messageInput.value = ""; // Clear input field
  });

  elements.fileInput.addEventListener("change", async () => {
    const file = elements.fileInput.files[0]; // Get the first selected file
    if (!file) return;

    const formData = new FormData();
    formData.append("fileData", file);
    formData.append("groupName", elements.groupNameDisplay.textContent); // Pass the group name to the server

    try {
      const { data } = await axios.post("/chat/upload-file", formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });

      const fileMessageData = {
        groupId: selectedGroupId,
        message: {
          content: data.fileUrl, // File URL from S3
          name: name,
          userId: userId,
        },
      };

      socket.emit("sendMessage", fileMessageData); // Send file URL as a message
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("File upload failed. Please try again.");
    }
  });
  socket.on("receiveMessage", (message) => {
    appendMessageToChat(message); // Append the received message to the chat UI
  });

  // Event Listeners
  elements.createGroupBtn.addEventListener("click", createGroup);
  elements.addGroupBtn.addEventListener("click", addUserToGroup);
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
