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
    
    [[self window] setDelegate:self];

    [[NSWorkspace sharedWorkspace] setIcon:[NSImage imageNamed:@"nide-project.icns"] forFile:projectPath options:NSExcludeQuickDrawElementsIconCreationOption];
    [[self window] setTitleWithRepresentedFilename:projectPath];
    
    if (shouldInit) {
        [task setArguments:[NSArray arrayWithObjects: nidePath, @"init", projectPath, @"--no-browser", @"--host", @"127.0.0.1", @"--port", portStr, nil]];
    } else {
        [task setArguments:[NSArray arrayWithObjects: nidePath, @"listen", projectPath, @"--no-browser", @"--host", @"127.0.0.1", @"--port", portStr, nil]];
    }

    [[NSDocumentController sharedDocumentController] noteNewRecentDocumentURL:[NSURL fileURLWithPath:projectPath]];
    
    [task launch];
    
    checkTimer = [[NSTimer scheduledTimerWithTimeInterval:1.0 target:self selector:@selector(checkIfTaskIsRunning) userInfo:nil repeats:YES] retain];

    [webView setFrameLoadDelegate:self];
    [webView setUIDelegate:self];
}

- (void) checkIfTaskIsRunning {
    if ([task isRunning]) {
        if (!loaded) {
            [[webView mainFrame] loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i", port]]]];
        }
    } else {
        NSString *errorMessage = [[NSString alloc] initWithData:[[error fileHandleForReading] readDataToEndOfFile] encoding:NSUTF8StringEncoding];
        NSRunAlertPanel(@"Internal error at the local server", @"%@", @"Close", nil, nil, errorMessage);
        [errorMessage release];
        [checkTimer invalidate];
    }
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame {
    loaded = YES;
    [self showWindow:self];
}

- (void)webView:(WebView *)sender didFailLoadWithError:(NSError *)loadError forFrame:(WebFrame *)frame {

}

- (void)webView:(WebView *)sender runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WebFrame *)frame {
    NSAlert *alert = [[NSAlert alloc] init];
    [alert addButtonWithTitle:@"OK"];
    [alert setMessageText:message];
    [alert runModal];
    [alert release];
}

- (BOOL)webView:(WebView *)sender runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WebFrame *)frame {
    NSInteger result = NSRunInformationalAlertPanel(NSLocalizedString(@"Nide", @""),  // title
                                                    message,                // message
                                                    NSLocalizedString(@"Yes", @""),      // default button
                                                    NSLocalizedString(@"No", @""),    // alt button
                                                    nil);
    return NSAlertDefaultReturn == result;  
}

- (void)windowWillClose:(NSNotification *)notification {
    [task terminate];
    [checkTimer invalidate];
}

- (IBAction)newDocument:(id)sender {
    [webView stringByEvaluatingJavaScriptFromString:@"$('#add-file').click()"];
}

- (IBAction)newFolder:(id)sender {
    [webView stringByEvaluatingJavaScriptFromString:@"$('#add-folder').click()"];    
}

- (void)dealloc {
    [checkTimer release];
    [task release];
    [super dealloc];
}

@end
