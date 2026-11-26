//! One job per item on a fixed set of scoped threads, results in item order.

use std::sync::Mutex;
use std::sync::atomic::{AtomicUsize, Ordering};

/// `work` applied to every item on up to `jobs` threads; each thread takes
/// the next item as it finishes one, so a slow file never idles the rest.
pub fn map<T: Sync, R: Send>(items: &[T], jobs: usize, work: impl Fn(&T) -> R + Sync) -> Vec<R> {
    let jobs = jobs.clamp(1, items.len().max(1));
    if jobs == 1 {
        return items.iter().map(work).collect();
    }
    let next = AtomicUsize::new(0);
    let results: Mutex<Vec<Option<R>>> = Mutex::new((0..items.len()).map(|_| None).collect());
    std::thread::scope(|scope| {
        for _ in 0..jobs {
            scope.spawn(|| {
                loop {
                    let index = next.fetch_add(1, Ordering::Relaxed);
                    let Some(item) = items.get(index) else { break };
                    let result = work(item);
                    results.lock().expect("a worker panicked")[index] = Some(result);
                }
            });
        }
    });
    results.into_inner().expect("a worker panicked").into_iter().map(|r| r.expect("every item ran")).collect()
}

#[cfg(test)]
mod tests {
    #[test]
    fn keeps_item_order() {
        let items: Vec<u32> = (0..100).collect();
        assert_eq!(super::map(&items, 4, |n| n * 2), items.iter().map(|n| n * 2).collect::<Vec<_>>());
    }
}
