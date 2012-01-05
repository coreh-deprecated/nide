//
//  NDProjectWindowController.m
//  Nide
//
//  Created by Marco Aurélio Buono Carone on 04/01/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "NDProjectWindowController.h"

@implementation NDProjectWindowController

- (id)initWithWindowNibName:(NSString *)windowNibName path:(NSString *)aProjectPath port:(int)aPort {
    self = [super initWithWindowNibName:windowNibName];
    
    if (self) {
        projectPath = aProjectPath;
        port = aPort;
    }
    
    return self;
}

- (void)windowDidLoad
{
    [super windowDidLoad];
    
    NSString *nidePath = [[NSBundle mainBundle] pathForResource:@"main" ofType:@"js"];
    NSDictionary *env = [NSDictionary dictionaryWithObjectsAndKeys:@"/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin", @"PATH", nil];
    NSString *portStr = [NSString stringWithFormat:@"%i", port];
    
    NSTask *task = [[NSTask alloc] init];
    
    [task setLaunchPath:@"/usr/local/bin/node"];
    [task setEnvironment: env];
    [task setArguments:[NSArray arrayWithObjects: nidePath, @"init", projectPath, @"--no-browser", @"--host", @"127.0.0.1", @"--port", portStr, nil]];
    
    [task launch];
    
    [[webView mainFrame] loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%@", portStr]]]];
}


@end
