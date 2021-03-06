import * as rx from 'rxjs';
import { execFile, ExecFileOptions, ChildProcess } from 'child_process';
import RxEndpoint from './rx-endpoint';

export class ExecFileEndpoint implements RxEndpoint<string> {
  private subProcess: ChildProcess;

  private file: string;
  private args: string[];
  private options: ExecFileOptions;

  public input: rx.Subject<string>;
  public output: rx.Subject<string>;

  public static command(file: string, args: string[] = [], options: ExecFileOptions = {}): ExecFileEndpoint {
    return new ExecFileEndpoint(file, args, options);
  }

  constructor(file: string, args: string[], options: ExecFileOptions) {
    this.file = file;
    this.args = args;
    this.options = options;
    this.input = rx.Observable.create((observer: rx.Observer<string>) => {
      const errorStack: any[] = [];
      this.subProcess = execFile(this.file, this.args, this.options);
      this.subProcess.stdout.on('data', stuff => {
        observer.next('' + stuff);
      });
      this.subProcess.stdout.on('error', (error: any) => {
        observer.error(error);
      });
      this.subProcess.on('close', (status, signal) => {
        if (!(status == 0)) {
          observer.error(errorStack.concat({ status: status, signal: signal }));
        } else if (errorStack.length) {
          observer.error(errorStack);
        } else {
          observer.complete();
        }
      });
      this.subProcess.on('error', (_data: any) => {
        errorStack.push(_data);
      });
    });
    this.output = new rx.Subject();
    this.output.subscribe(
      (a) => {
        this.subProcess.stdin.write(a);
      },
      (e) => { /* */ },
      () => {
        this.subProcess.stdin.end();
      }
    );
  }

}

export default ExecFileEndpoint;
