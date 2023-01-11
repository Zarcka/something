const listTabsElem = document.querySelector(".action--list-tabs");
const tabsBarElem = document.querySelector(".tab-bar");

listTabsElem.addEventListener("click", () => {
    tabsBarElem.classList.toggle("tabs-listed");
    listTabsElem.classList.toggle("tabs-listed");
});