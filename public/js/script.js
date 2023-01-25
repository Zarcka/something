const listTabsElem = document.querySelector(".action--list-tabs");
const tabsBarElem = document.querySelector(".tab-bar");
const listPagesElem = document.querySelector(".action--list-pages");
const pagesBarElem = document.querySelector(".URL-bar");

listTabsElem.addEventListener("click", () => {
    tabsBarElem.classList.toggle("tabs-listed");
    listTabsElem.classList.toggle("tabs-listed");
});

listPagesElem.addEventListener("click", () => {
    pagesBarElem.classList.toggle("pages-listed");
    listPagesElem.classList.toggle("pages-listed");
});