//
//  NDProjectWindowController.h
//  Nide
//
//  Created by Marco Aurélio Buono Carone on 04/01/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <WebKit/WebKit.h>
#import <Cocoa/Cocoa.h>

@interface NDProjectWindowController : NSWindowController<NSWindowDelegate> {
    NSString *projectPath;
    int port;
    IBOutlet NSWindow *window;
    IBOutlet WebView *webView;
}

- (id)initWithWindowNibName:(NSString *)windowNibName path:(NSString *)aProjectPath port:(int)port;

@end
