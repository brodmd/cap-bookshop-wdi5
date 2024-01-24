module.exports = {
	/**
	 * define actions for the page object
	 */
	iClickOnCreateNewBook: async () => {
		await browser
			.asControl({
				selector: {
					id: "books::BooksList--fe::table::Books::LineItem::StandardAction::Create",
					interaction: {
						idSuffix: "BDI-content",
					},
				},
			})
			.press();
	},

	theBookListContains: async (book_title) => {
		await browser.asControl({
			selector: {
				controlType: "sap.m.Link",
				viewName: "sap.fe.templates.ListReport.ListReport",
				viewId: "books::BooksList",
				properties: {
					text: "How to Cook Pancakes"
				}
			}
		}).toBeTruthy();
	},

	/**
	 * define assertions for the page object
	 */
};
