import mlflow


def main():
    mlflow.set_tracking_uri("sqlite:///mlflow.db")
    mlflow.set_experiment("phase0-smoke-test")

    with mlflow.start_run():
        mlflow.log_param("dummy_param", "hello")
        mlflow.log_metric("dummy_metric", 1.0)

    print("MLflow smoke test run logged successfully.")


if __name__ == "__main__":
    main()
