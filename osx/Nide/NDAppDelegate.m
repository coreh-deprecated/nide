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

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    port = 8123;
}

- (IBAction)newProject:(id)sender {
    NSSavePanel *savePanel = [NSSavePanel savePanel];
    
    savePanel.canCreateDirectories = YES;
    savePanel.title = @"Select a project name and location";
    
    if ([savePanel runModal] == NSOKButton) {
        NDProjectWindowController *windowController = [[NDProjectWindowController alloc] initWithWindowNibName:@"ProjectWindow" path:[[savePanel URL] path] port:port];
        [windowController showWindow:self];
        port += 2;
    }
}

@end
