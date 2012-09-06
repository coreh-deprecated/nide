#!/bin/bash
cp -R "$PROJECT_DIR/../client" "$TARGET_BUILD_DIR/$EXECUTABLE_NAME.app/Contents/Resources/"
cp -R "$PROJECT_DIR/../server" "$TARGET_BUILD_DIR/$EXECUTABLE_NAME.app/Contents/Resources/"
cp "$PROJECT_DIR/../main.js" "$TARGET_BUILD_DIR/$EXECUTABLE_NAME.app/Contents/Resources/"
cp "$PROJECT_DIR/../package.json" "$TARGET_BUILD_DIR/$EXECUTABLE_NAME.app/Contents/Resources/"
cd "$TARGET_BUILD_DIR/$EXECUTABLE_NAME.app/Contents/Resources/"
/usr/local/bin/node /usr/local/bin/npm install
