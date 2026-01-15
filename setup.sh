#!/bin/bash
set -e

# Installation backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "Configure ton .env maintenant"

# Installation frontend
cd ../frontend
npm install
cp .env.example .env
echo "Configure ton .env maintenant"

echo "Setup termine."
