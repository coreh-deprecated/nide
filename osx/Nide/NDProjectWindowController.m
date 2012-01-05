//
//  NDProjectWindowController.m
//  Nide
//
//  Created by Marco Aurélio Buono Carone on 04/01/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "NDProjectWindowController.h"

@implementation NDProjectWindowController

- (id)initWithWindowNibName:(NSString *)windowNibName path:(NSString *)aProjectPath port:(int)aPort init:(BOOL)init {
    self = [super initWithWindowNibName:windowNibName];
    
    if (self) {
        projectPath = aProjectPath;
        port = aPort;
        shouldInit = init;
    }
    
    return self;
}

- (void)windowDidLoad
{
    [super windowDidLoad];
    
    NSString *nidePath = [[NSBundle mainBundle] pathForResource:@"main" ofType:@"js"];
    NSDictionary *env = [NSDictionary dictionaryWithObjectsAndKeys:@"/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin", @"PATH", nil];
    NSString *portStr = [NSString stringWithFormat:@"%i", port];
    output = [NSPipe pipe];
    error = [NSPipe pipe];
    
    task = [[NSTask alloc] init];
    
    [task setLaunchPath:@"/usr/local/bin/node"];
    [task setEnvironment: env];
    [task setStandardOutput:output];
    [task setStandardError:error];
    
    if (shouldInit) {
        [task setArguments:[NSArray arrayWithObjects: nidePath, @"init", projectPath, @"--no-browser", @"--host", @"127.0.0.1", @"--port", portStr, nil]];
    } else {
        [task setArguments:[NSArray arrayWithObjects: nidePath, @"listen", projectPath, @"--no-browser", @"--host", @"127.0.0.1", @"--port", portStr, nil]];
    }
    
    [task launch];
    
    checkTimer = [NSTimer scheduledTimerWithTimeInterval:1.0 target:self selector:@selector(checkIfTaskIsRunning) userInfo:nil repeats:YES];
    
    [[webView mainFrame] loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%@", portStr]]]];
}

- (void) checkIfTaskIsRunning {
    if (![task isRunning]) {
        NSString *errorMessage = [[NSString alloc] initWithData:[[error fileHandleForReading] readDataToEndOfFile] encoding:NSUTF8StringEncoding];
        NSRunAlertPanel(@"Internal error at the local server", @"%@", @"Close", nil, nil, errorMessage);
        [errorMessage release];
        [checkTimer invalidate];
    }
}

- (void)dealloc {
    [task terminate];
    [task release];
    
    [super dealloc];
}

@end
