# Step-by-Step Roadmap for Discord Bot

## Overview
This Discord bot will use `discord.js` and the AniList API to provide anime-related functionalities to users. The primary features include retrieving user profile data from AniList, searching for anime in the AniList database, and managing a personalized watchlist. Notifications for new episodes of watchlisted anime will also be included as a low-priority feature.

---

## Step-by-Step Development Plan

### Step 1: Project Initialization (Week 1) ✅
1. Install Node.js and initialize the project using `npm init`.
2. Set up a Git repository for version control.
3. Install required dependencies:
   - `discord.js` for interacting with Discord.
   - `dotenv` for managing environment variables.
   - `axios` for API requests.
   - `mongoose` for MongoDB integration (if using MongoDB).
4. Create the bot's basic folder structure:
   - `/src`
     - `commands/`
     - `events/`
     - `utils/`
   - `.env` for API keys and tokens.
5. Register the bot with Discord and get the bot token.
6. Test a simple bot connection to Discord.

### Step 2: User Profile Retrieval (Week 2) ✅
1. Set up the AniList API:
   - Obtain an API key from AniList.
   - Test API requests using Postman or a similar tool.
2. Create a command to fetch and display AniList user profile data:
   - Use the `/profile` command.
   - Parse and format profile details like username, stats, and favorites.
3. Implement error handling for API request failures or invalid usernames.

### Step 3: Anime Search (Week 3) ✅
1. Design a `/search` command:
   - Accept search keywords or filters as arguments.
   - Query the AniList API for anime matching the criteria.
2. Format search results for clarity:
   - Display title, synopsis, and rating.
   - Limit the number of results for readability.
3. Handle edge cases (e.g., no results found).

### Step 4: Watchlist Management (Week 4-5) ✅
1. Set up a MongoDB database:
   - Create a `User` schema to store watchlists.
   - Connect the database to the project using `mongoose`.
2. Implement `/add` and `/remove` commands for the watchlist:
   - `/add <anime_id>`: Add an anime to the user's watchlist.
   - `/remove <anime_id>`: Remove an anime from the watchlist.
3. Create a `/watchlist` command to display the user's stored anime.
4. Ensure database operations are efficient and secure.

### Step 5: Notification System (Week 6-7)
1. Implement a scheduler using `node-cron`:
   - Periodically check the AniList API for new episodes of watchlisted anime.
   - Compare the latest episode count with the stored data.
2. Build a notification delivery system:
   - Send alerts to users via Discord DMs or a designated channel.
   - Allow users to customize notification settings.
3. Optimize the system to avoid excessive API calls.

### Step 6: AniList Account Linking (Week 7-8) ✅
1. Set up OAuth2 authentication with AniList:
   - Register the application on AniList to obtain client credentials.
   - Implement the OAuth2 flow to allow users to link their AniList accounts.
2. Create a `/link` command:
   - Direct users to the AniList authorization page.
   - Handle the callback to store the user's AniList access token securely.
3. Implement a `/unlink` command:
   - Allow users to unlink their AniList accounts.
   - Remove the stored access token from the database.
4. Update the notification system:
   - Use the linked AniList account to fetch personalized data.
   - Ensure notifications are sent based on the user's AniList watchlist.
5. Test the linking process:
   - Verify the OAuth2 flow works correctly.
   - Ensure data is securely stored and accessed.
   - Check for edge cases, such as expired tokens.

### Step 7: Add Favorite Anime Button (Week 8-9)
1. Update the `/profile` command:
   - Add a "Favorite Anime" button under the user's profile.
   - Fetch the user's favorite anime from their AniList profile.
2. Display favorite anime:
   - Show a list of the user's favorite anime with details like title, cover image, and description.
3. Handle button interactions:
   - Ensure the button correctly fetches and displays the favorite anime.
   - Handle edge cases, such as no favorite anime found.
4. Test the new feature:
   - Verify the button works correctly under various scenarios.
   - Ensure the favorite anime data is displayed accurately.

### Step 8: Testing and Optimization (Week 9-10)
1. Test each command and feature extensively:
   - Verify proper functioning under various scenarios.
   - Check for API rate limits and handle errors gracefully.
2. Optimize code for performance:
   - Refactor repetitive logic.
   - Ensure database queries are efficient.
3. Prepare for deployment:
   - Test the bot on a staging server.
   - Set up hosting on platforms like Heroku, AWS, or Railway.

### Step 9: Deployment and Maintenance
1. Deploy the bot to a hosting platform.
2. Monitor logs for errors and performance issues.
3. Collect user feedback for future improvements.
4. Plan regular updates to enhance features and fix bugs.

---

## Future Enhancements
- Add support for managing manga watchlists.
- Integrate with other anime databases (e.g., MyAnimeList).
- Enable multilingual support.
- Introduce premium features for advanced users.

---

## References
- [discord.js Documentation](https://discord.js.org/#/)
- [AniList API Documentation](https://anilist.gitbook.io/anilist-apiv2-docs/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)