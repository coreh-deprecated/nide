//
//  NDAppDelegate.h
//  Nide
//
//  Created by Marco Aurélio Buono Carone on 04/01/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface NDAppDelegate : NSObject <NSApplicationDelegate, NSOpenSavePanelDelegate> {
    int port;
}

@property (assign) IBOutlet NSWindow *window;

@end
