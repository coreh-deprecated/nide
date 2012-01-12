//
//  NDAppDelegate.m
//  Nide
//
//  Created by Marco Aurélio Buono Carone on 04/01/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "NDAppDelegate.h"
#import "NDProjectWindowController.h"

@implementation NDAppDelegate

@synthesize window = _window;

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{
    port = 8123;
}

- (IBAction)newProject:(id)sender {
    NSSavePanel *savePanel = [NSSavePanel savePanel];
    
    savePanel.canCreateDirectories = YES;
    savePanel.title = @"Select a project name and location";
    
    if ([savePanel runModal] == NSOKButton) {
        NDProjectWindowController *windowController = [[NDProjectWindowController alloc] initWithWindowNibName:@"ProjectWindow" path:[[savePanel URL] path] port:port init:YES];
        [windowController window];
        port += 2;
    }
}

- (IBAction)openDocument:(id)sender {
    NSOpenPanel *openPanel = [NSOpenPanel openPanel];
    
    openPanel.canChooseDirectories = YES;
    openPanel.canChooseFiles = NO;
    openPanel.title = @"Select a project folder";
    openPanel.delegate = self;
    
    if ([openPanel runModal] == NSOKButton) {
        NDProjectWindowController *windowController = [[NDProjectWindowController alloc] initWithWindowNibName:@"ProjectWindow" path:[[openPanel URL] path] port:port init:NO];
        [windowController window];
        port += 2;
    }
    
    openPanel.delegate = nil;
}

- (BOOL)panel:(id)sender shouldEnableURL:(NSURL *)url {
    BOOL isDirectory;
    if ([[NSFileManager defaultManager] fileExistsAtPath:[NSString stringWithFormat:@"%@/.nide", [url path]] isDirectory:&isDirectory]) {
        return isDirectory;
    } else {
        return NO;
    }
}

- (BOOL)application:(NSApplication *)theApplication openFile:(NSString *)filename {
    NDProjectWindowController *windowController = [[NDProjectWindowController alloc] initWithWindowNibName:@"ProjectWindow" path:filename port:port init:NO];
    [windowController window];
    port += 2;
    
    return YES;
}



@end
