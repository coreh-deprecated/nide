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
    BOOL shouldInit;
    BOOL loaded;
    NSTimer *checkTimer;
    NSTask *task;
    NSPipe *output;
    NSPipe *error;
    IBOutlet WebView *webView;
}

- (id)initWithWindowNibName:(NSString *)windowNibName path:(NSString *)aProjectPath port:(int)aPort init:(BOOL)init;

@end
