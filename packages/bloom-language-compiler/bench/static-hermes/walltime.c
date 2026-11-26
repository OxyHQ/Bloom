// walltime <runs> <cmd…>: runs cmd `runs` times, prints each run's wall time (µs) from fork to exit.
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/wait.h>
int main(int argc, char **argv) {
  int runs = atoi(argv[1]);
  for (int r = 0; r < runs; r++) {
    struct timespec a, b; clock_gettime(CLOCK_MONOTONIC, &a);
    pid_t p = fork();
    if (p == 0) { int fd = open("/dev/null", O_WRONLY); dup2(fd, 1); execv(argv[2], argv + 2); _exit(127); }
    int st; waitpid(p, &st, 0);
    clock_gettime(CLOCK_MONOTONIC, &b);
    printf("%ld\n", (b.tv_sec - a.tv_sec) * 1000000L + (b.tv_nsec - a.tv_nsec) / 1000);
  }
  return 0;
}
