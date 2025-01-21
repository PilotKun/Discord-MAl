# Initialize Git repository (if not already initialized)
git init

# Check Git status
git status

# Pull Code from Git
git pull origin main

# Add all untracked and modified files
git add .

# Commit changes with a meaningful message
git commit -m "What u updated should be here"

# Add remote repository (replace with your repository URL)
git remote add origin https://github.com/your-username/your-repository.git

# Push changes to GitHub
git push -u origin main