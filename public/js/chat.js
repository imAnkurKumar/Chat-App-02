document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  // Element references
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
    logoutBtn: document.querySelector(".logout-btn"),
    groupNameDisplay: document.getElementById("group-name"),
    groupMembersModal: document.getElementById("group-members-modal"),
    groupMembersList: document.getElementById("group-members-list"),
    fileInput: document.getElementById("file-input"),
    closeBtn: document.querySelector(".close-btn"),
  };

  const token = localStorage.getItem("token");
  const headers = { Authorization: token };
  let selectedGroupId = null;

  // Helper function to decode JWT token
  function decodeToken(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  }

  const decodedToken = decodeToken(token);
  const userId = decodedToken.id;
  const name = decodedToken.name;

  // Fetch and display groups when the page loads
  async function loadGroups() {
    try {
      const { data } = await axios.get("/chat/groups", { headers });
      elements.groupsList.innerHTML = "";
      data.groups.forEach(createGroupElement);
      addGroupClickListeners();
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  }

  // Create group element
  function createGroupElement(group) {
    const li = document.createElement("li");
    li.textContent = group.name;
    li.dataset.groupId = group.id;
    li.classList.add("group-item");
    elements.groupsList.appendChild(li);
  }

  // Add click listeners for groups
  function addGroupClickListeners() {
    document
      .querySelectorAll(".group-item")
      .forEach((item) =>
        item.addEventListener("click", () => selectGroup(item))
      );
  }

  // Select group and load its messages
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

  // Load messages for the selected group
  async function loadMessages(groupId) {
    try {
      const { data } = await axios.get(`/chat/groups/${groupId}/messages`, {
        headers,
      });
      elements.chatMessages.innerHTML = ""; // Clear messages before appending
      data.messages.forEach(appendMessageToChat);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }

  // Append a message to the chat
  function appendMessageToChat(message) {
    const messageElem = document.createElement("div");
    messageElem.classList.add("message");
    messageElem.innerHTML = message.content.includes("http")
      ? `<a href="${message.content}" target="_blank">${message.name} shared a file</a>`
      : `${message.name}: ${message.content}`;

    elements.chatMessages.appendChild(messageElem);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // Join a group via Socket.IO
  function joinGroup(groupId) {
    socket.emit("joinGroup", groupId);
  }

  // Send a text message or file
  elements.sendBtn.addEventListener("click", async () => {
    const messageContent = elements.messageInput.value.trim();
    const file = elements.fileInput.files[0]; // Get the selected file

    // Ensure a group is selected
    if (!selectedGroupId) {
      return alert("Please select a group first.");
    }

    // Handle file upload
    if (file) {
      const formData = new FormData();
      formData.append("fileData", file);
      formData.append("groupId", selectedGroupId);

      try {
        const { data } = await axios.post("/chat/upload-file", formData, {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        });

        // Send file URL as a message
        const fileMessageData = {
          groupId: selectedGroupId,
          message: { content: data.fileUrl, name, userId },
        };
        elements.fileInput.value = ""; // Clear file input after sending
      } catch (err) {
        console.error("Error uploading file:", err);
        alert("File upload failed. Please try again.");
      }
    }
    // Handle text message
    else if (messageContent) {
      const messageData = {
        groupId: selectedGroupId,
        message: { content: messageContent, name, userId },
      };

      // Emit the message via Socket.IO
      socket.emit("sendMessage", messageData);
      elements.messageInput.value = ""; // Clear input field after sending
    }
  });

  // Receive messages from the server
  socket.on("receiveMessage", appendMessageToChat);

  // Event listener to create a group
  elements.createGroupBtn.addEventListener("click", createGroup);

  // Create a new group
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

  // Error handling for group creation
  function handleGroupCreationError(err) {
    console.error("Error creating group:", err);
    alert(
      err.response && err.response.status === 400
        ? "Group name already exists!"
        : "Failed to create group. Please try again."
    );
  }

  // Add a user to the group
  elements.addGroupBtn.addEventListener("click", () => {
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
  });

  // Error handling for adding a user
  function handleAddUserError(error) {
    const errorMsg =
      error.response && error.response.data
        ? error.response.data.message
        : "Error adding user to group";
    alert(errorMsg);
  }

  // Show group members
  elements.groupNameDisplay.addEventListener("click", showGroupMembers);
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
        // li.textContent = member.name;
        li.textContent = member.isadmin
          ? `${member.name} (Admin)`
          : member.name;
        elements.groupMembersList.appendChild(li);
      });

      elements.groupMembersModal.style.display = "block"; // Show the modal
    } catch (err) {
      console.error("Error loading group members:", err);
    }
  }

  // Remove member from group
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
        removeBtn.addEventListener("click", () =>
          removeMemberFromGroup(member.id)
        );

        li.appendChild(removeBtn);
        elements.groupMembersList.appendChild(li);
      });

      elements.groupMembersModal.style.display = "block";
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  }

  async function removeMemberFromGroup(userId) {
    try {
      const { data } = await axios.delete(
        `/chat/groups/${selectedGroupId}/remove-user/${userId}`,
        { headers }
      );
      alert(data.message);
      showMembersForRemoval(); // Refresh the list
    } catch (err) {
      console.error("Error removing member from group:", err);
      alert(err.response?.data?.message || "Failed to remove member");
    }
  }

  // Make a user admin
  elements.makeAdminBtn.addEventListener("click", () => {
    if (!selectedGroupId) return alert("Please select a group first.");

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

  // Handle errors during the "Make Admin" request
  function handleMakeAdminError(error) {
    const errorMsg = error.response?.data?.message || "Error making user admin";
    alert(errorMsg);
  }

  // Modal close functionality
  elements.closeBtn.addEventListener("click", closeModal);
  function closeModal() {
    elements.groupMembersModal.style.display = "none";
  }

  // Toggle dropdown menu
  elements.menuBtn.addEventListener("click", toggleDropdownMenu);
  function toggleDropdownMenu() {
    elements.dropdownMenu.style.display =
      elements.dropdownMenu.style.display === "block" ? "none" : "block";
  }

  elements.logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "signUp.html";
  });

  // Close dropdown menu if clicked outside
  window.addEventListener("click", closeDropdownMenuOnClickOutside);
  function closeDropdownMenuOnClickOutside(e) {
    if (!e.target.matches(".menu-btn") && !e.target.closest(".dropdown-menu")) {
      elements.dropdownMenu.style.display = "none";
    }
  }

  // Load groups initially
  loadGroups();
});
