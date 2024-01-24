const ManageBooksPage = require("../pageobjects/manageBooks.page");
const NewBookPage = require("../pageobjects/newBook.page");

// Test Data
const book_title = "How to Cook Pancakes";


// Test Case Naming
const tcBaseName = "TC-Bookshop-wdi5-"
describe("Manage bookshop", () => {
	it(tcBaseName + "createNewBook", async () => {
		await ManageBooksPage.iClickOnCreateNewBook(); // open new book create page
		await NewBookPage.iEnterTitle(book_title); // enter title
		await NewBookPage.iSelectGenre() // select genre
		await NewBookPage.iSelectAuthor() // select athor

		await NewBookPage.iPressCreate(); // press create new book

		await NewBookPage.iSeeEditButton() // validate creation of new book successfull

	});

	it(tcBaseName + "checkBookAdded", async () => {
		await NewBookPage.iNavigateBack();
		await ManageBooksPage.theBookListContains(book_title);

	});


});