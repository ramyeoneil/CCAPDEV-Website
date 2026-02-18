window.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    loadReviews();

    // Image upload listener
    const imageUpload = document.getElementById("imageUpload");
    imageUpload.addEventListener("change", handleImageUpload);

    // Save button listener
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", saveProfile);
});

// Load profile from localStorage
function loadProfile() {
    const name = localStorage.getItem("username") || "John Doe";
    const bio = localStorage.getItem("userBio") || "PC enthusiast and reviewer.";
    const image = localStorage.getItem("profileImage") || "https://via.placeholder.com/150";

    document.getElementById("displayName").innerText = name;
    document.getElementById("displayBio").innerText = bio;
    document.getElementById("profileImage").src = image;

    document.getElementById("editName").value = name;
    document.getElementById("editBio").value = bio;
}

// Toggle edit form visibility
function toggleEdit() {
    const form = document.getElementById("editForm");
    form.style.display = form.style.display === "block" ? "none" : "block";
}

// Save profile to localStorage
function saveProfile() {
    const name = document.getElementById("editName").value;
    const bio = document.getElementById("editBio").value;

    localStorage.setItem("username", name);
    localStorage.setItem("userBio", bio);

    alert("Profile updated!");
    loadProfile();
    toggleEdit();
}

// Handle image upload
function handleImageUpload(event) {
    const reader = new FileReader();
    reader.onload = function () {
        document.getElementById("profileImage").src = reader.result;
        localStorage.setItem("profileImage", reader.result);
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Load reviews from localStorage or sample
function loadReviews() {
    const reviewGrid = document.getElementById("reviewGrid");
    reviewGrid.innerHTML = "";

    const savedReviews = JSON.parse(localStorage.getItem("userReviews"));

    const sampleReviews = [
        {
            store: "PC Express - SM North EDSA",
            text: "Excellent service and very helpful staff when choosing PC parts.",
            rating: 5
        },
        {
            store: "DynaQuest PC - Manila",
            text: "Affordable prices and fast delivery. Highly recommended!",
            rating: 4
        },
        {
            store: "EasyPC - Quezon City",
            text: "Wide selection of GPUs and smooth warranty process.",
            rating: 5
        },
        {
            store: "PC Hub - Gilmore",
            text: "Competitive pricing but store can get crowded.",
            rating: 4
        }
    ];

    const reviews = savedReviews && savedReviews.length > 0 ? savedReviews : sampleReviews;

    reviews.forEach(review => {
        const card = document.createElement("div");
        card.classList.add("review-card");

        let stars = "";
        for (let i = 0; i < review.rating; i++) {
            stars += "★";
        }

        card.innerHTML = `
            <h4>${review.store}</h4>
            <p>${review.text}</p>
            <div class="rating">${stars}</div>
        `;

        reviewGrid.appendChild(card);
    });
}